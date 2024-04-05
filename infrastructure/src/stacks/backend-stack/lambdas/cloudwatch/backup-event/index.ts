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
export class BackupEventLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `Cloudwatch-BackupEvent-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        functionName: `backup-event-${props.environment.toLowerCase()}`,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        timeout: Duration.minutes(15),
        environment: {
          ENVIRONMENT: props.environment,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['s3:*', 'cognito-idp:*', 'glue:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Action', 'Cloudwatch');
    Tags.of(this.function).add('Custom:Event', 'Backup');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
