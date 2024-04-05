/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
}

export class FormEventGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, bucket_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Campaign-Events-Form-Event-GET-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
          BUCKET_NAME: bucket_name,
        },
        functionName: `campaign-events-form-event-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 1024,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 's3:*'],
        resources: ['*'],
      }),
    );
  }
}
