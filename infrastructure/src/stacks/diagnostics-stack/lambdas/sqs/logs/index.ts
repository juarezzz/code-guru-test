/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration, Tags } from 'aws-cdk-lib';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { SQSConstruct } from '_stacks/diagnostics-stack/constructs/SQS';
import { TimestreamConstruct } from '_stacks/diagnostics-stack/constructs/Timestream';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  sqs_construct: SQSConstruct;
  timestream_construct: TimestreamConstruct;
}

export class LogMetricsLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly case: LambdaInvoke;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `Log-Metrics-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TIMESTREAM_NAME:
            props.timestream_construct.tables.logs_table.tableName || '',
        },
        events: [props.sqs_construct.event_sources.logs_event_source],
        functionName: `log-metrics-event-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['timestream:*', 'sqs:*'],
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
        timeout: Duration.seconds(120),
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Logs');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
