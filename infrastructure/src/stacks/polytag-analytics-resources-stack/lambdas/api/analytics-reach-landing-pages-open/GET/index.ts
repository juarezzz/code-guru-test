/* ----------- External ----------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Constructs ---------- */
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';

/* ----------- Interfaces ----------- */
interface Props {
  layers: Layers;
  environment: string;
  iam_construct: IAMConstruct;
  cors_allowed_origin: string;
}

export class AnalyticsReachLandingPagesOpenGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, timestream_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      scope,
      `Analytics-Reach-Landing-Pages-Open-GET-Function-${props.environment}`,
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
        functionName: `analytics-reach-landing-pages-open-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          props.iam_construct.policies.dynamodb,
          props.iam_construct.policies.timestream,
        ],
        layers: [props.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 2048,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
        role: props.iam_construct.roles.default,
      },
    );

    this.rule = new Rule(
      scope,
      `Analytics-Reach-Landing-Pages-Open-GET-Rule-${props.environment}`,
      {
        ruleName: `analytics-reach-landing-pages-open-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
