/* ---------- External ---------- */
import path from 'path';
import { config } from 'dotenv';
import { Construct } from 'constructs';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { CachePolicy, OriginRequestPolicy } from 'aws-cdk-lib/aws-cloudfront';
import {
  NextjsImage,
  NextjsStaticAssets,
  NextjsBuild,
  NextjsDistribution,
  NextjsServer,
} from 'cdk-nextjs-standalone';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Stacks ---------- */
import { CertificateWebStack } from '_stacks/certificates/certificate-web-stack';

/* ---------- Constructs ---------- */

interface Props extends StackProps {
  environment: string;
}

/* ---------- Constants ---------- */
const NEXTJS_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'web-printer-portal',
);

config();

export class WebPrinterStack extends Stack {
  public readonly certificate_web_stack: CertificateWebStack;

  public readonly nextjs_assets: NextjsStaticAssets;

  public readonly nextjs_bucket: Bucket;

  public readonly nextjs_build: NextjsBuild;

  public readonly nextjs_distribution: NextjsDistribution;

  public readonly nextjs_image: NextjsImage;

  public readonly nextjs_server: NextjsServer;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    /* ----------
     * Constants
     * ---------- */

    const {
      api_domain_name,
      bucket_name,
      domain_name,
      printer_domain_name,
    }: CDK.Context = this.node.tryGetContext(props.environment);

    const backend_url = `https://${api_domain_name}`;
    const bucket_url = `https://${bucket_name}.s3.eu-west-1.amazonaws.com`;
    const cognito_domain = `https://polytag-printer-${props.environment.toLowerCase()}.auth.eu-west-1.amazoncognito.com/`;
    const redirect_url = `https://${domain_name}/login`;

    /* ----------
     * Domain Certificate
     * ---------- */

    this.certificate_web_stack = new CertificateWebStack(
      this,
      `${props.environment}-Certificate-Web-Printer`,
      {
        environment: props.environment,
        stack_name: `${props.environment}-Certificate-Web-Printer`,
        description: `Certificates for Web Printer stack at ${props.environment} environment`,
        removalPolicy: RemovalPolicy.DESTROY,
      },
    );

    /* ----------
     * Web Distribution
     * ---------- */

    this.nextjs_bucket = new Bucket(
      this,
      `Polytag-Web-Printer-Bucket-${props.environment}`,
      {
        bucketName: `polytag-${props.environment.toLocaleLowerCase()}-web-printer-bucket`,
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        autoDeleteObjects: props.environment !== 'PROD',
        publicReadAccess: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
        cors: [
          {
            allowedMethods: [
              HttpMethods.GET,
              HttpMethods.HEAD,
              HttpMethods.PUT,
              HttpMethods.POST,
            ],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
          },
        ],
      },
    );

    this.nextjs_build = new NextjsBuild(
      this,
      `Polytag-Web-Printer-Build-${props.environment}`,
      {
        nextjsPath: NEXTJS_DIR,
        buildCommand: 'npx --yes --yarn open-next@latest build',
        buildPath: NEXTJS_DIR,
        projectRoot: NEXTJS_DIR,
        environment: {
          NEXT_PUBLIC_COGNITO_DOMAIN: cognito_domain,
          NEXT_PUBLIC_INFRA_BACKEND_URL: backend_url,
          NEXT_PUBLIC_REDIRECT_URL: redirect_url,
          NEXT_PUBLIC_MAIN_BUCKET_URL: bucket_url,
        },
      },
    );

    this.nextjs_server = new NextjsServer(
      this,
      `Polytag-Web-Printer-Lambda-${props.environment}`,
      {
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetBucket: this.nextjs_bucket,
        lambda: {
          functionName: `polytag-${props.environment.toLocaleLowerCase()}-web-printer-lambda`,
          description:
            'Lambda responsbile for rendering server-side printer portal components',
          architecture: Architecture.ARM_64,
          memorySize: 2048,
        },
      },
    );

    this.nextjs_image = new NextjsImage(
      this,
      `Polytag-Web-Printer-ImageOpsLambda-${props.environment}`,
      {
        lambdaOptions: {
          functionName: `polytag-${props.environment.toLocaleLowerCase()}-web-printer-img-lambda`,
          description:
            'Lambda responsbile for optimizing printer portal images',
          architecture: Architecture.ARM_64,
          memorySize: 2048,
        },
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        bucket: this.nextjs_bucket,
      },
    );

    this.nextjs_assets = new NextjsStaticAssets(
      this,
      `Polytag-Web-Printer-Assets-Deployment-${props.environment}`,
      {
        nextBuild: this.nextjs_build,
        bucket: this.nextjs_bucket,
      },
    );

    this.nextjs_distribution = new NextjsDistribution(
      this,
      `Polytag-Web-Printer-Distribution-${props.environment}`,
      {
        customDomain: {
          certificate:
            this.certificate_web_stack.route_53_construct.polytag_certificate,
          domainName: printer_domain_name,
          hostedZone:
            this.certificate_web_stack.route_53_construct.hosted_zones.polytag,
        },
        imageOptFunction: this.nextjs_image,
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetsBucket: this.nextjs_bucket,
        serverFunction: this.nextjs_server.lambdaFunction,
        cachePolicies: {
          imageCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Image-CachePolicyWeb-Printer-Default-${props.environment}`,
            process.env.CF_IMAGE_CACHE_POLICY_ID || '',
          ),
          serverCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Lambda-CachePolicyWeb-Printer-Default-${props.environment}`,
            process.env.CF_LAMBDA_CACHE_POLICY_ID || '',
          ),
          staticCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Statics-CachePolicyWeb-Printer-Default-${props.environment}`,
            process.env.CF_STATICS_CACHE_POLICY_ID || '',
          ),
        },
        originRequestPolicies: {
          imageOptimizationOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              this,
              `NextJS-Image-OriginPolicyWeb-Printer-Default-${props.environment}`,
              process.env.CF_IMAGE_ORIGIN_POLICY_ID || '',
            ),
          serverOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              this,
              `NextJS-Lambda-OriginPolicyWeb-Printer-Default-${props.environment}`,
              process.env.CF_LAMBDA_ORIGIN_POLICY_ID || '',
            ),
        },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.nextjs_bucket).add('Custom:Service', 'S3');
    Tags.of(this.nextjs_bucket).add('Custom:Bucket', 'Web Printer');
    Tags.of(this.nextjs_bucket).add('Custom:Environment', props.environment);
  }
}
