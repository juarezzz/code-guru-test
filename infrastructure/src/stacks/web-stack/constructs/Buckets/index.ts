/* ---------- External ---------- */
import { RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Bucket, HttpMethods, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import path from 'path';

/* ---------- Interfaces ---------- */
interface Buckets {
  analytics_web_bucket: Bucket;
  polytag_web_bucket: Bucket;
}

interface BucketsDeployment {
  analytics_web_bucket: BucketDeployment;
}

interface Props {
  environment: string;
}

export class BucketsConstruct extends Construct {
  public readonly buckets: Buckets;

  public readonly buckets_deployment: BucketsDeployment;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    /* ----------
     * Buckets initializations
     * ---------- */
    this.buckets = {
      analytics_web_bucket: new Bucket(
        scope,
        `Polytag-Web-Analytics-Bucket-${props.environment}`,
        {
          bucketName: `polytag-${props.environment.toLowerCase()}-analytics-web-bucket`,
          removalPolicy:
            props.environment === 'PROD'
              ? RemovalPolicy.RETAIN
              : RemovalPolicy.DESTROY,
          autoDeleteObjects: props.environment !== 'PROD',
          publicReadAccess: true,
          blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
          websiteIndexDocument: 'index.html',
          websiteErrorDocument: 'index.html',
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
      ),
      polytag_web_bucket: new Bucket(
        scope,
        `Polytag-Web-Bucket-${props.environment}`,
        {
          bucketName: `polytag-${props.environment.toLocaleLowerCase()}-web-bucket`,
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
      ),
    };

    this.buckets_deployment = {
      analytics_web_bucket: new BucketDeployment(
        scope,
        `Polytag-Web-Analytics-Bucket-Deployment-${props.environment}`,
        {
          sources: [
            Source.asset(
              path.resolve(
                __dirname,
                '..',
                '..',
                'assets',
                'analytics',
                'index.zip',
              ),
            ),
          ],
          destinationBucket: this.buckets.analytics_web_bucket,
          destinationKeyPrefix: '/',
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.buckets.analytics_web_bucket).add('Custom:Service', 'S3');
    Tags.of(this.buckets.analytics_web_bucket).add(
      'Custom:Bucket',
      'Analytics Web',
    );
    Tags.of(this.buckets.analytics_web_bucket).add(
      'Custom:Environment',
      props.environment,
    );

    Tags.of(this.buckets.polytag_web_bucket).add('Custom:Service', 'S3');
    Tags.of(this.buckets.polytag_web_bucket).add('Custom:Bucket', 'Web Bucket');
    Tags.of(this.buckets.polytag_web_bucket).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
