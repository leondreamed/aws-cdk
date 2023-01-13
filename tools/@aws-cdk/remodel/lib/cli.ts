import yargs from 'yargs/yargs';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as cp from 'child_process';

const exec = (cmd: string, opts?: cp.ExecOptions) => new Promise((ok, ko) => {
  const proc = cp.exec(cmd, opts, (err: cp.ExecException | null, stdout: string | Buffer, stderr: string | Buffer) => {
    if (err) {
      return ko(err);
    }

    return ok({stdout, stderr});
  });

  proc.stdout?.pipe(process.stdout);
  proc.stderr?.pipe(process.stderr);
});

export async function main() {
  const args = yargs(process.argv.slice(2))
    .command('$0 [REPO_ROOT]', 'Magically restructure cdk repository', argv =>
      argv
        .positional('REPO_ROOT', {
          type: 'string',
          desc: 'The root of the cdk repo to be magicked',
          default: '.',
          normalize: true,
        })
        .option('dry-run', {
          type: 'boolean',
          default: false,
          desc: 'don\'t replace files in working directory',
          defaultDescription: 'replace files in working directory, will delete old package files and directories in favor of new structure.',
        })
        .option('clean', {
          type: 'boolean',
          default: true,
          desc: 'remove intermediary directory with new structure, negate with --no-clean',
        })
        .option('tmp-dir', {
          type: 'string',
          desc: 'temporary intermediate directory, removed unless --no-clean is specified',
        })
    )
    .argv;

    const { 'tmp-dir': tmpDir, REPO_ROOT: repoRoot, clean } = args;

    const targetDir = path.resolve(tmpDir ?? await fs.mkdtemp('magic-'));

    if (fs.existsSync(targetDir)){
      await fs.remove(targetDir);
    }
    await fs.mkdir(targetDir);

    // Clone all source files from the current repo to our new working
    // directory. The entire copy including the .git directory ensures git can
    // be aware of all source file moves if needed via `git move`.
    await exec(`git clone ${repoRoot} ${targetDir}`);

    const templateDir = path.join(__dirname, '..', 'lib', 'template');

    await copyTemplateFiles(templateDir, targetDir);
    await makeAwsCdkLib(targetDir);

    await runBuild(targetDir);

    if (clean) {
      await fs.remove(path.resolve(targetDir));
    }
}

async function copyTemplateFiles(src: string, target: string) {
  await fs.copy(src, target, { overwrite: true });
}

async function makeAwsCdkLib(target: string) {
  const awsCdkLibDir = path.join(target, 'packages', 'aws-cdk-lib');
  const pkgJsonPath = path.join(awsCdkLibDir, 'package.json');
  const pkgJson = await fs.readJson(pkgJsonPath);

  const excludeBundled = [
    'cdk-build-tools',
    'pkglint',
    'ubergen',
  ].map(x => `@aws-cdk/${x}`);

  const devDependencies: { [key: string]: string } = pkgJson?.devDependencies ?? {};
  const localBundledDeps = Object.keys(devDependencies).filter(p => p.startsWith('@aws-cdk/') && !excludeBundled.includes(p));
  
  const filteredDevDeps = Object.entries(devDependencies).reduce((accum, [p, v]: [string, string]) => {
    if (localBundledDeps.includes(p)) return accum;

    return {
      ...accum,
      [p]: v,
    };
  }, {});

  await fs.writeFile(pkgJsonPath, JSON.stringify({
    ...pkgJson,
    scripts: {
      ...pkgJson.scripts,
      'gen': 'ts-node scripts/gen.ts',
      'build': 'yarn gen',
    },
    devDependencies: {
      ...filteredDevDeps,
      '@aws-cdk/cfn2ts': '0.0.0',
    },
  }, null, 2));
}

async function runBuild(target: string) {
  const awsCdkLibDir = path.join(target, 'packages', 'aws-cdk-lib');

  await exec('yarn install', { cwd: target });

  await exec('npx lerna run build --scope aws-cdk-lib --include-dependencies', { cwd: awsCdkLibDir });
  await exec('yarn gen', { cwd: awsCdkLibDir });
}
