/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  cors_allowed_origin: string;
}

export class BrandBrandsGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      scope,
      `Brand-Brands-GET-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: table_name,
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
        },
        functionName: `brand-brands-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'cognito-idp:*'],
            resources: ['*'],
          }),
        ],
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

    this.rule = new Rule(scope, `Brand-Brands-GET-Rule-${props.environment}`, {
      schedule: Schedule.cron({
        minute: '*/2',
      }),
      targets: [new LambdaFunction(this.function)],
      description: `Rule responsible for running the Brand Brands Lambda every 2 minutes and keeping the Lambda warm.`,
      ruleName: `brand-brands-get-rule-${props.environment.toLowerCase()}`,
    });
  }
}
