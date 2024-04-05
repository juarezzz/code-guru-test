/* ---------- External ---------- */
import path from 'path';
import { config } from 'dotenv';
import { Construct } from 'constructs';
import { execSync } from 'child_process';
import { Architecture } from 'aws-cdk-lib/aws-lambda';
import { CachePolicy, OriginRequestPolicy } from 'aws-cdk-lib/aws-cloudfront';
import {
  NextjsImage,
  NextjsStaticAssets,
  NextjsServer,
  NextjsBuild,
  NextjsDistribution,
} from 'cdk-nextjs-standalone';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Stacks ---------- */
import { CertificateWebStack } from '_stacks/certificates/certificate-web-stack';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/web-stack/constructs/Buckets';

/* ---------- Constants ---------- */
const NEXTJS_DIR = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  '..',
  '..',
  'web',
);

config();

/* ---------- Interfaces ---------- */
interface Props {
  profile?: string;
  environment: string;
  bucket_construct: BucketsConstruct;
  certificate_web_stack: CertificateWebStack;
}

interface SecretsManagerCLIResult {
  ARN: string;
  Name: string;
  VersionId: string;
  CreatedDate: string;
  SecretString?: string;
  VersionStages: string[];
}

interface PolytagSecretsObject {
  GOOGLE_MAPS_TOKEN?: string;
}

export class NextJSConstruct extends Construct {
  public readonly nextjs_assets: NextjsStaticAssets;

  public readonly nextjs_build: NextjsBuild;

  public readonly nextjs_distribution: NextjsDistribution;

  public readonly nextjs_image: NextjsImage;

  public readonly nextjs_server: NextjsServer;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ----------
     * Constants
     * ---------- */

    const {
      region,
      secret_name,
      bucket_name,
      domain_name,
      api_domain_name,
      mixpanel_proxy_domain_name,
      google_analytics_id,
      web_analytics_domain,
    }: CDK.Context = this.node.tryGetContext(props.environment);

    const backend_url = `https://${api_domain_name}`;
    const mixpanel_proxy_url = `https://${mixpanel_proxy_domain_name}`;
    const bucket_url = `https://${bucket_name}.s3.eu-west-1.amazonaws.com`;
    const cognito_domain = `https://polytag-${props.environment.toLowerCase()}.auth.eu-west-1.amazoncognito.com/`;
    const infra_edge_url = `https://${web_analytics_domain}`;
    const redirect_url = `https://${domain_name}/login`;

    /* ----------
     * Fetching Google Maps token from Secrets Manager
     * ---------- */

    let google_maps_token: string;
    let cli_command = `aws secretsmanager get-secret-value --secret-id ${secret_name} --output json --region ${region}`;

    if (props.profile) cli_command += ` --profile ${props.profile}`;

    try {
      const cli_result = execSync(cli_command);

      const parsed_result: SecretsManagerCLIResult = JSON.parse(
        cli_result.toString(),
      );

      if (!parsed_result?.SecretString) throw new Error();

      const parsed_secret: PolytagSecretsObject = JSON.parse(
        parsed_result.SecretString,
      );

      if (!parsed_secret?.GOOGLE_MAPS_TOKEN) throw new Error();

      google_maps_token = parsed_secret.GOOGLE_MAPS_TOKEN;
    } catch (error) {
      throw new Error("Couldn't fetch GOOGLE_MAPS_TOKEN from Secrets Manager");
    }

    /* ----------
     * Web Distribution
     * ---------- */
    this.nextjs_build = new NextjsBuild(
      this,
      `Polytag-Web-Build-${props.environment}`,
      {
        nextjsPath: NEXTJS_DIR,
        buildPath: NEXTJS_DIR,
        projectRoot: NEXTJS_DIR,
        buildCommand: 'npx --yes --yarn open-next@latest build',
        environment: {
          NEXT_PUBLIC_COGNITO_DOMAIN: cognito_domain,
          NEXT_PUBLIC_INFRA_BACKEND_URL: backend_url,
          NEXT_PUBLIC_WEB_ANALYTICS_URL: infra_edge_url,
          NEXT_PUBLIC_REDIRECT_URL: redirect_url,
          NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: google_analytics_id,
          NEXT_PUBLIC_AG_GRID_KEY: process.env.NEXT_PUBLIC_AG_GRID_KEY || '',
          NEXT_PUBLIC_MIXPANEL_TOKEN:
            process.env[`NEXT_PUBLIC_MIXPANEL_TOKEN_${props.environment}`] ||
            '',
          NEXT_PUBLIC_MIXPANEL_DOMAIN: mixpanel_proxy_url,
          NEXT_PUBLIC_MAIN_BUCKET_URL: bucket_url,
          NEXT_PUBLIC_GOOGLE_MAPS_API: google_maps_token,
        },
      },
    );

    this.nextjs_server = new NextjsServer(
      this,
      `Polytag-Web-Lambda-${props.environment}`,
      {
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetBucket: props.bucket_construct.buckets.polytag_web_bucket,
        lambda: {
          functionName: `polytag-nextjs-${props.environment.toLocaleLowerCase()}-web-lambda`,
          description:
            'Lambda responsbile for rendering server-side Polytag web components',
          architecture: Architecture.ARM_64,
          memorySize: 2048,
        },
      },
    );

    this.nextjs_image = new NextjsImage(
      this,
      `Polytag-Web-ImageOpsLambda-${props.environment}`,
      {
        bucket: props.bucket_construct.buckets.polytag_web_bucket,
        lambdaOptions: {
          functionName: `polytag-nextjs-${props.environment.toLocaleLowerCase()}-web-img-lambda`,
          description: 'Lambda responsbile for optimizing Polytag web images',
          architecture: Architecture.ARM_64,
          memorySize: 2048,
        },
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
      },
    );

    this.nextjs_assets = new NextjsStaticAssets(
      this,
      `Polytag-Web-Assets-Deployment-${props.environment}`,
      {
        bucket: props.bucket_construct.buckets.polytag_web_bucket,
        nextBuild: this.nextjs_build,
      },
    );

    this.nextjs_distribution = new NextjsDistribution(
      this,
      `Polytag-Web-Distribution-${props.environment}`,
      {
        customDomain: {
          certificate:
            props.certificate_web_stack.route_53_construct.polytag_certificate,
          domainName: domain_name,
          hostedZone:
            props.certificate_web_stack.route_53_construct.hosted_zones.polytag,
        },
        imageOptFunction: this.nextjs_image,
        nextBuild: this.nextjs_build,
        nextjsPath: NEXTJS_DIR,
        staticAssetsBucket: props.bucket_construct.buckets.polytag_web_bucket,
        serverFunction: this.nextjs_server.lambdaFunction,
        cachePolicies: {
          imageCachePolicy: CachePolicy.fromCachePolicyId(
            scope,
            `NextJS-Image-CachePolicyWeb-Default-${props.environment}`,
            process.env.CF_IMAGE_CACHE_POLICY_ID || '',
          ),
          serverCachePolicy: CachePolicy.fromCachePolicyId(
            scope,
            `NextJS-Lambda-CachePolicyWeb-Default-${props.environment}`,
            process.env.CF_LAMBDA_CACHE_POLICY_ID || '',
          ),
          staticCachePolicy: CachePolicy.fromCachePolicyId(
            scope,
            `NextJS-Statics-CachePolicyWeb-Default-${props.environment}`,
            process.env.CF_STATICS_CACHE_POLICY_ID || '',
          ),
        },
        originRequestPolicies: {
          imageOptimizationOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              scope,
              `NextJS-Image-OriginPolicyWeb-Default-${props.environment}`,
              process.env.CF_IMAGE_ORIGIN_POLICY_ID || '',
            ),
          serverOriginRequestPolicy:
            OriginRequestPolicy.fromOriginRequestPolicyId(
              scope,
              `NextJS-Lambda-OriginPolicyWeb-Default-${props.environment}`,
              process.env.CF_LAMBDA_ORIGIN_POLICY_ID || '',
            ),
        },
      },
    );
  }
}
