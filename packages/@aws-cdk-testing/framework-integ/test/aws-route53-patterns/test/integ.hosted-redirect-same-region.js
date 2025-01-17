"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_route53_1 = require("aws-cdk-lib/aws-route53");
const aws_cdk_lib_1 = require("aws-cdk-lib");
// import { ROUTE53_PATTERNS_USE_CERTIFICATE } from '@aws-cdk/cx-api';
const integ_tests_alpha_1 = require("@aws-cdk/integ-tests-alpha");
const aws_route53_patterns_1 = require("aws-cdk-lib/aws-route53-patterns");
const hostedZoneId = process.env.CDK_INTEG_HOSTED_ZONE_ID ?? process.env.HOSTED_ZONE_ID;
if (!hostedZoneId)
    throw new Error('For this test you must provide your own HostedZoneId as an env var "HOSTED_ZONE_ID"');
const hostedZoneName = process.env.CDK_INTEG_HOSTED_ZONE_NAME ?? process.env.HOSTED_ZONE_NAME;
if (!hostedZoneName)
    throw new Error('For this test you must provide your own HostedZoneName as an env var "HOSTED_ZONE_NAME"');
const domainName = process.env.CDK_INTEG_DOMAIN_NAME ?? process.env.DOMAIN_NAME;
if (!domainName)
    throw new Error('For this test you must provide your own Domain Name as an env var "DOMAIN_NAME"');
const app = new aws_cdk_lib_1.App({
// uncomment this to test the old behavior
// postCliContext: {
//   [ROUTE53_PATTERNS_USE_CERTIFICATE]: false,
// },
});
const testCase = new aws_cdk_lib_1.Stack(app, 'integ-https-redirect-same-region', {
    env: { region: 'us-east-1' },
});
const hostedZone = aws_route53_1.PublicHostedZone.fromHostedZoneAttributes(testCase, 'HostedZone', {
    hostedZoneId,
    zoneName: hostedZoneName,
});
new aws_route53_patterns_1.HttpsRedirect(testCase, 'redirect', {
    zone: hostedZone,
    recordNames: [`integ-same-region.${hostedZoneName}`],
    targetDomain: 'aws.amazon.com',
});
new integ_tests_alpha_1.IntegTest(app, 'integ-test', {
    testCases: [testCase],
    enableLookups: true,
    stackUpdateWorkflow: false,
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW50ZWcuaG9zdGVkLXJlZGlyZWN0LXNhbWUtcmVnaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiaW50ZWcuaG9zdGVkLXJlZGlyZWN0LXNhbWUtcmVnaW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEseURBQTJEO0FBQzNELDZDQUF5QztBQUN6QyxzRUFBc0U7QUFDdEUsa0VBQXVEO0FBQ3ZELDJFQUFpRTtBQUNqRSxNQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO0FBQ3hGLElBQUksQ0FBQyxZQUFZO0lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxxRkFBcUYsQ0FBQyxDQUFDO0FBQzFILE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQztBQUM5RixJQUFJLENBQUMsY0FBYztJQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMseUZBQXlGLENBQUMsQ0FBQztBQUNoSSxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDO0FBQ2hGLElBQUksQ0FBQyxVQUFVO0lBQUUsTUFBTSxJQUFJLEtBQUssQ0FBQyxpRkFBaUYsQ0FBQyxDQUFDO0FBRXBILE1BQU0sR0FBRyxHQUFHLElBQUksaUJBQUcsQ0FBQztBQUNsQiwwQ0FBMEM7QUFDMUMsb0JBQW9CO0FBQ3BCLCtDQUErQztBQUMvQyxLQUFLO0NBQ04sQ0FBQyxDQUFDO0FBQ0gsTUFBTSxRQUFRLEdBQUcsSUFBSSxtQkFBSyxDQUFDLEdBQUcsRUFBRSxrQ0FBa0MsRUFBRTtJQUNsRSxHQUFHLEVBQUUsRUFBRSxNQUFNLEVBQUUsV0FBVyxFQUFFO0NBQzdCLENBQUMsQ0FBQztBQUVILE1BQU0sVUFBVSxHQUFHLDhCQUFnQixDQUFDLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUU7SUFDbkYsWUFBWTtJQUNaLFFBQVEsRUFBRSxjQUFjO0NBQ3pCLENBQUMsQ0FBQztBQUNILElBQUksb0NBQWEsQ0FBQyxRQUFRLEVBQUUsVUFBVSxFQUFFO0lBQ3RDLElBQUksRUFBRSxVQUFVO0lBQ2hCLFdBQVcsRUFBRSxDQUFDLHFCQUFxQixjQUFjLEVBQUUsQ0FBQztJQUNwRCxZQUFZLEVBQUUsZ0JBQWdCO0NBQy9CLENBQUMsQ0FBQztBQUVILElBQUksNkJBQVMsQ0FBQyxHQUFHLEVBQUUsWUFBWSxFQUFFO0lBQy9CLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQztJQUNyQixhQUFhLEVBQUUsSUFBSTtJQUNuQixtQkFBbUIsRUFBRSxLQUFLO0NBQzNCLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFB1YmxpY0hvc3RlZFpvbmUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XG5pbXBvcnQgeyBTdGFjaywgQXBwIH0gZnJvbSAnYXdzLWNkay1saWInO1xuLy8gaW1wb3J0IHsgUk9VVEU1M19QQVRURVJOU19VU0VfQ0VSVElGSUNBVEUgfSBmcm9tICdAYXdzLWNkay9jeC1hcGknO1xuaW1wb3J0IHsgSW50ZWdUZXN0IH0gZnJvbSAnQGF3cy1jZGsvaW50ZWctdGVzdHMtYWxwaGEnO1xuaW1wb3J0IHsgSHR0cHNSZWRpcmVjdCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1yb3V0ZTUzLXBhdHRlcm5zJztcbmNvbnN0IGhvc3RlZFpvbmVJZCA9IHByb2Nlc3MuZW52LkNES19JTlRFR19IT1NURURfWk9ORV9JRCA/PyBwcm9jZXNzLmVudi5IT1NURURfWk9ORV9JRDtcbmlmICghaG9zdGVkWm9uZUlkKSB0aHJvdyBuZXcgRXJyb3IoJ0ZvciB0aGlzIHRlc3QgeW91IG11c3QgcHJvdmlkZSB5b3VyIG93biBIb3N0ZWRab25lSWQgYXMgYW4gZW52IHZhciBcIkhPU1RFRF9aT05FX0lEXCInKTtcbmNvbnN0IGhvc3RlZFpvbmVOYW1lID0gcHJvY2Vzcy5lbnYuQ0RLX0lOVEVHX0hPU1RFRF9aT05FX05BTUUgPz8gcHJvY2Vzcy5lbnYuSE9TVEVEX1pPTkVfTkFNRTtcbmlmICghaG9zdGVkWm9uZU5hbWUpIHRocm93IG5ldyBFcnJvcignRm9yIHRoaXMgdGVzdCB5b3UgbXVzdCBwcm92aWRlIHlvdXIgb3duIEhvc3RlZFpvbmVOYW1lIGFzIGFuIGVudiB2YXIgXCJIT1NURURfWk9ORV9OQU1FXCInKTtcbmNvbnN0IGRvbWFpbk5hbWUgPSBwcm9jZXNzLmVudi5DREtfSU5URUdfRE9NQUlOX05BTUUgPz8gcHJvY2Vzcy5lbnYuRE9NQUlOX05BTUU7XG5pZiAoIWRvbWFpbk5hbWUpIHRocm93IG5ldyBFcnJvcignRm9yIHRoaXMgdGVzdCB5b3UgbXVzdCBwcm92aWRlIHlvdXIgb3duIERvbWFpbiBOYW1lIGFzIGFuIGVudiB2YXIgXCJET01BSU5fTkFNRVwiJyk7XG5cbmNvbnN0IGFwcCA9IG5ldyBBcHAoe1xuICAvLyB1bmNvbW1lbnQgdGhpcyB0byB0ZXN0IHRoZSBvbGQgYmVoYXZpb3JcbiAgLy8gcG9zdENsaUNvbnRleHQ6IHtcbiAgLy8gICBbUk9VVEU1M19QQVRURVJOU19VU0VfQ0VSVElGSUNBVEVdOiBmYWxzZSxcbiAgLy8gfSxcbn0pO1xuY29uc3QgdGVzdENhc2UgPSBuZXcgU3RhY2soYXBwLCAnaW50ZWctaHR0cHMtcmVkaXJlY3Qtc2FtZS1yZWdpb24nLCB7XG4gIGVudjogeyByZWdpb246ICd1cy1lYXN0LTEnIH0sXG59KTtcblxuY29uc3QgaG9zdGVkWm9uZSA9IFB1YmxpY0hvc3RlZFpvbmUuZnJvbUhvc3RlZFpvbmVBdHRyaWJ1dGVzKHRlc3RDYXNlLCAnSG9zdGVkWm9uZScsIHtcbiAgaG9zdGVkWm9uZUlkLFxuICB6b25lTmFtZTogaG9zdGVkWm9uZU5hbWUsXG59KTtcbm5ldyBIdHRwc1JlZGlyZWN0KHRlc3RDYXNlLCAncmVkaXJlY3QnLCB7XG4gIHpvbmU6IGhvc3RlZFpvbmUsXG4gIHJlY29yZE5hbWVzOiBbYGludGVnLXNhbWUtcmVnaW9uLiR7aG9zdGVkWm9uZU5hbWV9YF0sXG4gIHRhcmdldERvbWFpbjogJ2F3cy5hbWF6b24uY29tJyxcbn0pO1xuXG5uZXcgSW50ZWdUZXN0KGFwcCwgJ2ludGVnLXRlc3QnLCB7XG4gIHRlc3RDYXNlczogW3Rlc3RDYXNlXSxcbiAgZW5hYmxlTG9va3VwczogdHJ1ZSxcbiAgc3RhY2tVcGRhdGVXb3JrZmxvdzogZmFsc2UsXG59KTtcblxuIl19