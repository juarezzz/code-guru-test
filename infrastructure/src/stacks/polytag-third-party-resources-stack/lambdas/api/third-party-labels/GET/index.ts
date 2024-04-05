/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Interfaces -------------- */
interface Props {
  environment: string;
  layers_construct: LayersConstruct;
  queue_url: string;
}

export class ThirdPartyLabelsGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { timestream_name, labels_table_name, table_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      this,
      `ThirdPartyLabels-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda', 'base-64'],
        },
        description:
          'Get third party labels from DynamoDB table for a given user.',
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          MAIN_TABLE_NAME: table_name,
          LABELS_TABLE_NAME: labels_table_name,
          TIMESTREAM_NAME: timestream_name,
          QUEUE_URL: props.queue_url,
        },
        functionName: `third-party-labels-get-${props.environment.toLowerCase()}`,
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'timestream:*', 'sqs:*'],
            resources: ['*'],
          }),
        ],
        handler: 'handler',
        layers: [props.layers_construct.layers.aws_lambda],
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

    this.rule = new Rule(
      scope,
      `Third-Party-Labels-Rule-GET-${props.environment}`,
      {
        ruleName: `third-party-labels-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
