/* ----------- External ----------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ----------- Interfaces ----------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
}

export class BrandDisplayPageGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Brand-Display-Page-GET-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
        },
        functionName: `brand-display-page-get-${props.environment.toLowerCase()}`,
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
        actions: ['dynamodb:*'],
        resources: ['*'],
      }),
    );

    this.rule = new Rule(
      scope,
      `Brand-Display-Page-GET-Rule-${props.environment}`,
      {
        ruleName: `brand-display-page-get-rule-${props.environment.toLowerCase()}`,
        schedule: Schedule.cron({ minute: '*/2' }),
        targets: [new LambdaFunction(this.function)],
      },
    );
  }
}
