/* -------------- External -------------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

/* -------------- Interfaces -------------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class InspectorOutputLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `InspectorOutputLambda-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        logRetention: RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `inspector-output-${props.environment.toLowerCase()}`,
        handler: 'handler',
        timeout: Duration.seconds(60),
        environment: {
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
          ENVIRONMENT: props.environment.toLowerCase(),
          BUCKET_NAME: props.s3_buckets.inspector_output_bucket.bucketName,
        },
        memorySize: 256,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['inspector2:*', 's3:*', 'kms:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Inspector Output');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
