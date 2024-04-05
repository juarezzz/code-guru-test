/* -------------- External -------------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { Alarm, Metric } from 'aws-cdk-lib/aws-cloudwatch';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* -------------- Constructs -------------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* -------------- Interfaces -------------- */
interface Props {
  layers: Layers;
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
}

export class DynamoDBStreamLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly invocations_metric: Metric;

  public readonly invocations_alarm: Alarm;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { bucket_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      scope,
      `DynamoDBStream-Lambda-${props.environment}`,
      {
        functionName: `dynamo-stream-${props.environment.toLowerCase()}`,
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        timeout: Duration.minutes(10),
        memorySize: 1024,
        environment: {
          BUCKET_NAME: bucket_name,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          ENVIRONMENT: props.environment,
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
        },
        layers: [props.layers.aws_lambda],
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 's3:*', 'ses:*'],
        resources: ['*'],
      }),
    );

    this.function.addEventSource(
      props.dynamodb_construct.event_sources.main_table_event_source,
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Stream');
    Tags.of(this.function).add('Custom:StreamDestination', 'Dynamo');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
