/* ---------- External ---------- */
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { Buckets } from '_stacks/diagnostics-stack/constructs/Buckets/@types';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class BucketsConstruct extends Construct {
  public readonly buckets: Buckets;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    /* ----------
     * Buckets initializations
     * ---------- */
    this.buckets = {
      diagnostics_bucket: new Bucket(
        scope,
        `DiagnosticsBucket-${props.environment}`,
        {
          bucketName: `polytag-${props.environment.toLocaleLowerCase()}-diagnostics-bucket`,
          blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
          accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL,
          removalPolicy:
            props.environment === 'PROD'
              ? RemovalPolicy.RETAIN
              : RemovalPolicy.DESTROY,
          autoDeleteObjects: props.environment !== 'PROD',
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
          lifecycleRules: [
            {
              expiration: Duration.days(7),
              prefix: 'test-screenshots/',
            },
          ],
        },
      ),
    };

    /* ----------
     * Access Rules
     * ---------- */
    this.buckets.diagnostics_bucket.grantPublicAccess('test-screenshots/*');

    /* ---------- Tags ---------- */
    Tags.of(this.buckets.diagnostics_bucket).add('Custom:Service', 'S3');
    Tags.of(this.buckets.diagnostics_bucket).add(
      'Custom:Bucket',
      'Diagnostics',
    );
    Tags.of(this).add('Custom:Environment', props.environment);
  }
}
