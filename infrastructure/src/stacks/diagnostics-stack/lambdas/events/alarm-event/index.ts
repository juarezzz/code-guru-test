/* ---------- External ---------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}
export class AlarmEventLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `Cloudwatch-AlarmEvent-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        functionName: `alarm-event-${props.environment.toLowerCase()}`,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        timeout: Duration.seconds(120),
        environment: {
          ENVIRONMENT: props.environment,
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['cloudwatch:*', 's3:*', 'sns:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Action', 'Cloudwatch');
    Tags.of(this.function).add('Custom:Event', 'Alarm');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
