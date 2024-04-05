/* ----------- External ----------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ----------- Interfaces ----------- */
interface Props {
  layers: Layers;
  environment: string;
  cors_allowed_origin: string;
}

export class AnalyticsSustainabilityRecentActivityGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { timestream_name, table_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      scope,
      `Analytics-Sustainability-RecentActivity-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: table_name,
          TIMESTREAM_NAME: timestream_name,
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
        },
        functionName: `analytics-sustainability-recent-activity-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['timestream:*', 'dynamodb:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 256,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );

    this.rule = new Rule(
      scope,
      `Analytics-Sustainability-RecentActivity-GET-Rule-${props.environment}`,
      {
        ruleName: `analytics-sustainability-recent-activity-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
