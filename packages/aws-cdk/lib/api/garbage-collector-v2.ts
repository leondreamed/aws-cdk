/* eslint-disable no-console */
import * as path from 'path';
import * as cxapi from '@aws-cdk/cx-api';
import { ECR, S3 } from 'aws-sdk';
import { ISDK, SdkProvider } from './aws-auth';
import { Mode } from './aws-auth/credentials';
import { ToolkitInfo } from './toolkit-info';

const ISOLATED_TAG = 'awscdk.isolated';
interface GarbageCollectorProps {
  /**
   * If this property is set, then instead of garbage collecting, we will
   * print the isolated asset hashes.
   */
  readonly dryRun: boolean;

  readonly type: 'ecr' | 's3' | 'all';

  readonly inIsolationFor: number;

  /**
   * The environment to deploy this stack in
   *
   * The environment on the stack artifact may be unresolved, this one
   * must be resolved.
   */
  readonly resolvedEnvironment: cxapi.Environment;

  /**
    * SDK provider (seeded with default credentials)
    *
    * Will exclusively be used to assume publishing credentials (which must
    * start out from current credentials regardless of whether we've assumed an
    * action role to touch the stack or not).
    *
    * Used for the following purposes:
    *
    * - Publish legacy assets.
    * - Upload large CloudFormation templates to the staging bucket.
    */
  readonly sdkProvider: SdkProvider;
}

export class GarbageCollectorV2 {
  private templates: string = '';
  public constructor(private readonly props: GarbageCollectorProps) {
  }

  public async garbageCollect() {
    const totalStart = Date.now();
    const sdk = (await this.props.sdkProvider.forEnvironment(this.props.resolvedEnvironment, Mode.ForWriting)).sdk;
    console.log('Collecting Templates');
    let start = Date.now();
    await this.getTemplates(sdk);
    console.log('Finished collecting templates: ', formatTime(start), ' seconds');

    if (this.props.type === 's3' || this.props.type === 'all') {
      console.log('Getting bootstrap bucket');
      start = Date.now();
      const bucket = await this.getBootstrapBucket(sdk);
      console.log('Got bootstrap bucket:', formatTime(start), 'seconds');

      console.log('Collecting object hashes');
      start = Date.now();
      const objects = await this.collectObjectHashes(sdk, bucket);
      console.log('Collected object hashes:', formatTime(start), 'seconds');

      console.log('Listing isolated objects');
      start = Date.now();
      const isolatedObjects = this.listIsolatedObjects(objects);
      console.log('Listed isolated objects:', formatTime(start), 'seconds');
      console.log(isolatedObjects);
      console.log(isolatedObjects.length);

      if (!this.props.dryRun) {
        console.log('Tagging isolated objects');
        start = Date.now();
        await this.tagIsolatedObjects(sdk, bucket, isolatedObjects);
        console.log('Tagged isolated buckets:', formatTime(start), 'seconds');
      } else {
        console.log('dry run was set, so skipping object tagging');
      }
    }

    if (this.props.type === 'ecr' || this.props.type === 'all') {
      console.log('Getting bootstrap repositories');
      start = Date.now();
      const repos = await this.getBootstrapRepositories(sdk);
      console.log('Got bootstrapped repositories:', formatTime(start), 'seconds');

      for (const repo of repos) {
        console.log(`Collecting isolated images in ${repo}`);
        start = Date.now();
        const isolatedImages = await this.collectIsolatedImages(sdk, repo);
        console.log(`Collected isolated images in ${repo}:`, formatTime(start), 'seconds');

        if (!this.props.dryRun) {
          console.log(`Tagging isolated images in ${repo}`);
          start = Date.now();
          await this.tagIsolatedImages(sdk, repo, isolatedImages);
          console.log(`Tagged isolated images in ${repo}:`, formatTime(start), 'seconds');
        } else {
          console.log('dry run was set, so skipping image tagging');
        }
      }
    }

    console.log('Total Garbage Collection time:', formatTime(totalStart), 'seconds');
  }

  private listIsolatedObjects(objects: string[]) {
    return objects.filter((obj) => !this.templates.includes(getHash(obj)));
  }

  private async getTemplates(sdk: ISDK) {
    const cfn = sdk.cloudFormation();
    const stackNames: string[] = [];
    await paginateSdkCall(async (nextToken) => {
      const response = await cfn.listStacks({ NextToken: nextToken }).promise();
      stackNames.push(...(response.StackSummaries ?? []).map(s => s.StackId ?? s.StackName));
      return response.NextToken;
    });

    console.log('num stacks:', stackNames.length);

    // TODO: gracefully fail this
    const templates = [];
    for (const stack of stackNames) {
      const template = await cfn.getTemplate({
        StackName: stack,
      }).promise();

      templates.push(template.TemplateBody ?? '');
    }

    this.templates = templates.join('');
  }

  private async getBootstrapBucket(sdk: ISDK) {
    // maybe use tags like for ecr
    const info = await ToolkitInfo.lookup(this.props.resolvedEnvironment, sdk, undefined);
    return info.bucketName;
  }

  private async collectObjectHashes(sdk: ISDK, bucket: string) {
    const s3 = sdk.s3();
    const objectHashes: string[] = [];
    await paginateSdkCall(async (nextToken) => {
      const response = await s3.listObjectsV2({
        Bucket: bucket,
        ContinuationToken: nextToken,
      }).promise();
      response.Contents?.forEach((obj) => {
        objectHashes.push(obj.Key ?? '');
      });
      return response.NextContinuationToken;
    });

    console.log(objectHashes);
    console.log('num isolated', objectHashes.length);

    return objectHashes;
  }

  private async tagIsolatedObjects(sdk: ISDK, bucket: string, objects: string[]) {
    const s3 = sdk.s3();
    for (const obj of objects) {
      // check if the object has been tagged in a previous gc run
      const response = await s3.getObjectTagging({
        Bucket: bucket,
        Key: obj,
      }).promise();
      let alreadyTagged = false;
      let tagDate = '';
      for (const tag of response.TagSet) {
        if (tag.Key === ISOLATED_TAG) {
          alreadyTagged = true;
          tagDate = tag.Value;
        }
      }
      // tag new objects with the current date
      if (!alreadyTagged) {
        await s3.putObjectTagging({
          Bucket: bucket,
          Key: obj,
          Tagging: {
            TagSet: [{
              Key: ISOLATED_TAG,
              Value: Date.now().toString(),
            }],
          },
        }).promise();
      } else {
        console.log('already tagged', response.TagSet[0].Value);
        if (this.canBeSafelyDeleted(Number(tagDate))) {
          console.log('Deleting', obj);
          await this.deleteObject(s3, bucket, obj);
        }
      }
    }
  }

  private async deleteObject(s3: S3, bucket: string, key: string) {
    await s3.deleteObject({
      Bucket: bucket,
      Key: key,
    }).promise();
  }

  /* ECR methods */

  private async getBootstrapRepositories(sdk: ISDK) {
    const ecr = sdk.ecr();
    let repos: ECR.RepositoryList = [];
    await paginateSdkCall(async (nextToken) => {
      const response = await ecr.describeRepositories({ nextToken: nextToken }).promise();
      repos = response.repositories ?? [];
      return response.nextToken;
    });
    const bootstrappedRepos: string[] = [];
    for (const repo of repos ?? []) {
      if (!repo.repositoryArn || !repo.repositoryName) { continue; }
      const tags = await ecr.listTagsForResource({
        resourceArn: repo.repositoryArn,
      }).promise();
      for (const tag of tags.tags ?? []) {
        if (tag.Key === 'awscdk:asset' && tag.Value === 'true') {
          bootstrappedRepos.push(repo.repositoryName);
        }
      }
    }
    return bootstrappedRepos;
  }

  private async collectIsolatedImages(sdk: ISDK, repo: string) {
    const ecr = sdk.ecr();
    const isolatedImages: string[] = [];
    await paginateSdkCall(async (nextToken) => {
      const response = await ecr.listImages({
        repositoryName: repo,
        nextToken: nextToken,
      }).promise();
      // map unique image digest to (possibly multiple) tags
      const images = imageMap(response.imageIds ?? []);
      // make sure all tags of an image are isolated
      for (const [digest, tags] of Object.entries(images)) {
        let del = true;
        for (const tag of tags) {
          if (this.templates.includes(tag)) {
            del = false;
          }
        }
        if (del) {
          isolatedImages.push(digest);
        }
      }
      return response.nextToken;
    });

    console.log(isolatedImages);
    console.log('num isolated', isolatedImages.length);

    return isolatedImages;
  }

  private async tagIsolatedImages(sdk: ISDK, repo: string, images: string[]) {
    const ecr = sdk.ecr();
    const imageIds: ECR.ImageIdentifierList = [];
    images.forEach((i) => imageIds.push({ imageDigest: i }));
    const response = await ecr.batchGetImage({
      repositoryName: repo,
      imageIds,
    }).promise();

    const imagesMapToTags: Record<string, string[]> = {};
    const imagesMapToManifest: Record<string, string> = {};
    for (const image of response.images ?? []) {
      const imageDigest = image.imageId?.imageDigest;
      const imageTag = image.imageId?.imageTag;
      if (!imageDigest || !imageTag) { continue; }
      if (!imagesMapToTags[imageDigest]) {
        imagesMapToTags[imageDigest] = [];
      }
      imagesMapToTags[imageDigest].push(imageTag);
      imagesMapToManifest[imageDigest] = image.imageManifest ?? '';
    }

    // check if image is already tagged from a previous gc run
    const filteredImages = [];
    for (const [digest, tags] of Object.entries(imagesMapToTags)) {
      let alreadyTagged = false;
      let tagDate = '';
      for (const tag of tags) {
        if (tag.startsWith(ISOLATED_TAG)) {
          alreadyTagged = true;
          tagDate = tag.slice(16);
        }
      }
      if (!alreadyTagged) {
        filteredImages.push(digest);
      } else {
        console.log('image already tagged', tagDate);
        if (this.canBeSafelyDeleted(Number(tagDate))) {
          console.log('Deleting', digest);
          await this.deleteImage(ecr, repo, digest);
        }
      }
    }

    // tag images with current date
    for (const imageDigest of filteredImages) {
      await ecr.putImage({
        repositoryName: repo,
        imageManifest: imagesMapToManifest[imageDigest],
        imageTag: `${ISOLATED_TAG}-${Date.now().toString()}`,
      }).promise();
    }
  }

  private async deleteImage(ecr: ECR, repo: string, digest: string) {
    await ecr.batchDeleteImage({
      repositoryName: repo,
      imageIds: [{
        imageDigest: digest,
      }],
    }).promise();
  }

  private canBeSafelyDeleted(time: number): boolean {
    // divide 1000 for seconds, another 60 for minutes, another 60 for hours, 24 for days
    const daysElapsed = (Date.now() - time) / (1000 * 60 * 60 * 24);
    console.log(daysElapsed, this.props.inIsolationFor);
    return daysElapsed > this.props.inIsolationFor;
  }
}

async function paginateSdkCall(cb: (nextToken?: string) => Promise<string | undefined>) {
  let finished = false;
  let nextToken: string | undefined;
  while (!finished) {
    nextToken = await cb(nextToken);
    if (nextToken === undefined) {
      finished = true;
    }
  }
}

function getHash(file: string) {
  return path.basename(file, path.extname(file));
}

function formatTime(start: number): number {
  return (Date.now() - start) / 1000;
}

function imageMap(imageIds: ECR.ImageIdentifierList) {
  const images: Record<string, string[]> = {};
  for (const image of imageIds ?? []) {
    if (!image.imageDigest || !image.imageTag) { continue; }
    if (!images[image.imageDigest]) {
      images[image.imageDigest] = [];
    }
    images[image.imageDigest].push(image.imageTag);
  }
  return images;
}

// function addToObject<T>(key: string, val: T, obj: Record<string, T[]>) {
//   if (!obj[key]) {
//     obj[key] = [];
//   }
//   obj[key].push(val);
// }