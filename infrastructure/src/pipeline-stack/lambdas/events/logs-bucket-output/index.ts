/* -------------- External -------------- */
import path from 'path';
import { Duration, SecretValue, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Bucket } from 'aws-cdk-lib/aws-s3';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* -------------- Interfaces -------------- */
interface Props {
  environment: string;
  bucket_event_source: Bucket;
}

export class LogsBucketOutputLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly token: SecretValue;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { secret_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.token = SecretValue.secretsManager(secret_name, {
      jsonField: 'GITHUB_TOKEN',
    });

    this.function = new NodejsFunction(
      scope,
      `LogsBucketOutputLambda-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        logRetention: RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `logs-bucket-output-${props.environment.toLowerCase()}`,
        handler: 'handler',
        timeout: Duration.seconds(60),
        environment: {
          TOKEN: this.token.toString(),
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
          SOURCE_BUCKET_NAME: props.bucket_event_source.bucketName,
          ENVIRONMENT: props.environment.toLowerCase(),
        },
        memorySize: 256,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Bucket Output');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
