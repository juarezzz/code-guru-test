/* -------------- External -------------- */
import path from 'path';
import { Duration, SecretValue } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/* -------------- Constructs -------------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* -------------- Interfaces -------------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class StartPipePutLambda extends Construct {
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
      `StartPipe-PUT-Function-${props.environment}-PIPE`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        timeout: Duration.seconds(32),
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `start-pipe-put-${props.environment.toLowerCase()}`,
        memorySize: 1024,
        environment: {
          BUCKET_NAME: props.s3_buckets.logs_bucket.bucketName,
          ENVIRONMENT: props.environment,
          TOKEN: this.token.toString(),
          WHITELIST: process.env.WHITELIST as string,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['codepipeline:*', 's3:*'],
        resources: ['*'],
      }),
    );
  }
}
