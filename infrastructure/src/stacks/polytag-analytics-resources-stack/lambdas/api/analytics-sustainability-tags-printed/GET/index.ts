/* ----------- External ----------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
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

export class AnalyticsSustainabilityTagsPrintedGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, timestream_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      scope,
      `Analytics-Sustainability-TagsPrinted-GET-Function-${props.environment}`,
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
        functionName: `analytics-sustainability-tags-printed-get-${props.environment.toLowerCase()}`,
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
      `Analytics-Sustainability-TagsPrinted-GET-Rule-${props.environment}`,
      {
        ruleName: `analytics-sustainability-tags-printed-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
