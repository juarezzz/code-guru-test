/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { RemovalPolicy, Stack, StackProps, Tags } from 'aws-cdk-lib';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { BlockPublicAccess, Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import {
  NextjsServer,
  NextjsDistribution,
  NextjsBuild,
  NextjsImage,
  NextjsStaticAssets,
} from 'cdk-nextjs-standalone';
import {
  CertificateValidation,
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import { CachePolicy, OriginRequestPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { Architecture } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */

interface Props extends StackProps {
  environment: string;
}

/* ---------- Constants ---------- */
const NEXTJS_DIR = path.resolve(__dirname, '..', '..', '..', '..', 'web-admin');

export interface HostedZones {
  polytag: IHostedZone;
}

export class WebAdminStack extends Stack {
  public readonly hosted_zones: HostedZones;

  public readonly polytag_certificate: DnsValidatedCertificate;

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
      admin_domain_name,
      domain_name,
      api_domain_name,
      bucket_name,
    }: CDK.Context = this.node.tryGetContext(props.environment);

    const cognito_domain = `https://polytag-admin-${props.environment.toLowerCase()}.auth.eu-west-1.amazoncognito.com`;
    const backend_url = `https://${api_domain_name}`;
    const bucket_url = `https://${bucket_name}.s3.eu-west-1.amazonaws.com`;

    /* ----------
     * Domain Certificate
     * ---------- */

    this.hosted_zones = {
      polytag: HostedZone.fromLookup(
        this,
        `HostedZone--${props.environment}-Web-Admin`,
        {
          domainName: 'polyt.ag',
        },
      ),
    };

    this.polytag_certificate = new DnsValidatedCertificate(
      this,
      `Polytag-ACM-Certificate-${props.environment}-Web`,
      {
        domainName: domain_name,
        hostedZone: this.hosted_zones.polytag,
        certificateName: `polytag-certificate-${props.environment.toLowerCase()}-web-admin`,
        cleanupRoute53Records: true,
        region: 'us-east-1',
        validation: CertificateValidation.fromDns(this.hosted_zones.polytag),
        subjectAlternativeNames: ['*.polyt.ag'],
      },
    );

    /* ----------
     * Web Distribution
     * ---------- */

    this.nextjs_bucket = new Bucket(
      this,
      `Polytag-Web-Admin-Bucket-${props.environment}`,
      {
        bucketName: `polytag-${props.environment.toLocaleLowerCase()}-web-admin-bucket`,
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
      `Polytag-Web-Admin-Build-${props.environment}`,
      {
        nextjsPath: NEXTJS_DIR,
        buildPath: NEXTJS_DIR,
        projectRoot: NEXTJS_DIR,
        environment: {
          NEXT_PUBLIC_MAIN_BUCKET_URL: bucket_url,
          NEXT_PUBLIC_COGNITO_DOMAIN: cognito_domain,
          NEXT_PUBLIC_INFRA_BACKEND_URL: backend_url,
        },
      },
    );

    this.nextjs_server = new NextjsServer(
      this,
      `Polytag-Web-Admin-Lambda-${props.environment}`,
      {
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetBucket: this.nextjs_bucket,
        lambda: {
          architecture: Architecture.ARM_64,
          description:
            'Lambda responsbile for rendering server-side admin web components',
          functionName: `polytag-${props.environment.toLocaleLowerCase()}-web-admin-lambda`,
          memorySize: 2048,
        },
      },
    );

    this.nextjs_image = new NextjsImage(
      this,
      `Polytag-Web-Admin-ImageOpsLambda-${props.environment}`,
      {
        lambdaOptions: {
          architecture: Architecture.ARM_64,
          description: 'Lambda responsbile for optimizing admin web images',
          functionName: `polytag-${props.environment.toLocaleLowerCase()}-web-admin-img-lambda`,
          memorySize: 2048,
        },
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        bucket: this.nextjs_bucket,
      },
    );

    this.nextjs_assets = new NextjsStaticAssets(
      this,
      `Polytag-Web-Admin-Assets-Deployment-${props.environment}`,
      {
        nextBuild: this.nextjs_build,
        bucket: this.nextjs_bucket,
      },
    );

    this.nextjs_distribution = new NextjsDistribution(
      this,
      `Polytag-Web-Admin-Distribution-${props.environment}`,
      {
        customDomain: {
          certificate: this.polytag_certificate,
          domainName: admin_domain_name,
          hostedZone: this.hosted_zones.polytag,
        },
        cachePolicies: {
          imageCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Image-CachePolicyWeb-Admin-Default-${props.environment}`,
            process.env.CF_IMAGE_CACHE_POLICY_ID || '',
          ),
          serverCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Lambda-CachePolicyWeb-Admin-Default-${props.environment}`,
            process.env.CF_LAMBDA_CACHE_POLICY_ID || '',
          ),
          staticCachePolicy: CachePolicy.fromCachePolicyId(
            this,
            `NextJS-Statics-CachePolicyWeb-Admin-Default-${props.environment}`,
            process.env.CF_STATICS_CACHE_POLICY_ID || '',
          ),
        },
        imageOptFunction: this.nextjs_image,
        originRequestPolicies: {
          imageOptimizationOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              this,
              `NextJS-Image-OriginPolicyWeb-Default-${props.environment}`,
              process.env.CF_IMAGE_ORIGIN_POLICY_ID || '',
            ),
          serverOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              this,
              `NextJS-Lambda-OriginPolicyWeb-Default-${props.environment}`,
              process.env.CF_LAMBDA_ORIGIN_POLICY_ID || '',
            ),
        },
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetsBucket: this.nextjs_bucket,
        serverFunction: this.nextjs_server.lambdaFunction,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.nextjs_bucket).add('Custom:Service', 'S3');
    Tags.of(this.nextjs_bucket).add('Custom:Bucket', 'Web Admin');
    Tags.of(this.nextjs_bucket).add('Custom:Environment', props.environment);
  }
}
