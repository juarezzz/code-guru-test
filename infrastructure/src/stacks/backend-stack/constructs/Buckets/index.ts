/* ---------- External ---------- */
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import {
  BlockPublicAccess,
  Bucket,
  BucketAccessControl,
  EventType,
  HttpMethods,
} from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { Buckets } from '_stacks/backend-stack/constructs/Buckets/@types';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LambdasConstruct } from '_stacks/backend-stack/constructs/Lambdas';
import { StateMachineConstruct } from '_stacks/backend-stack/constructs/StateMachine';

/* ---------- Interfaces ---------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  lambdas_construct: LambdasConstruct;
  state_machine_construct: StateMachineConstruct;
}

export class BucketsConstruct extends Construct {
  public readonly buckets: Buckets;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);
    /* ----------
     * Buckets initializations
     * ---------- */
    this.buckets = {
      main_bucket: new Bucket(scope, `MainBucket-${props.environment}`, {
        bucketName: `polytag-${props.environment.toLocaleLowerCase()}-main-bucket`,
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
            expiration: Duration.days(2),
            prefix: 'serialised-codes/',
          },
          {
            expiration: Duration.days(2),
            prefix: 'campaign-events/',
          },
        ],
      }),

      backup_bucket: new Bucket(scope, `BackupBucket-${props.environment}`, {
        bucketName: `polytag-${props.environment.toLowerCase()}-backup-bucket`,
        removalPolicy:
          props.environment === 'PROD'
            ? RemovalPolicy.RETAIN
            : RemovalPolicy.DESTROY,
        autoDeleteObjects: props.environment !== 'PROD',
        publicReadAccess: false,
        lifecycleRules: [
          {
            expiration: Duration.days(90),
            prefix: 'timestream/',
          },
        ],
      }),
    };

    /* ----------
     * Notifications
     * ---------- */
    this.buckets.main_bucket.addEventNotification(
      EventType.OBJECT_CREATED,
      new LambdaDestination(props.lambdas_construct.lambdas.s3.stream.function),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.buckets.main_bucket).add('Custom:Service', 'S3');
    Tags.of(this.buckets.main_bucket).add('Custom:Bucket', 'Main');
    Tags.of(this.buckets.backup_bucket).add('Custom:Bucket', 'Backup');
    Tags.of(this).add('Custom:Environment', props.environment);
  }
}
