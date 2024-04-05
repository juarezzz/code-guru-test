/* ---------- External ---------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class CampaignsHealthcheckEventLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      scope,
      `Cloudwatch-CampaignsHealthcheckEvent-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        memorySize: 1024,
        functionName: `campaigns-healthcheck-event-${props.environment.toLowerCase()}`,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        timeout: Duration.minutes(5),
        environment: {
          TABLE_NAME: table_name,
          ENVIRONMENT: props.environment,
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*'],
            resources: ['*'],
          }),
        ],
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Action', 'Cloudwatch');
    Tags.of(this.function).add('Custom:Event', 'Campaign Healthcheck');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
