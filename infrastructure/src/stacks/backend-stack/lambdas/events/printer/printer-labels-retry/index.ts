/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration, Tags } from 'aws-cdk-lib';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  sqs_construct: SQSConstruct;
}

export class PrinterLabelsRetryLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly case: LambdaInvoke;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { labels_table_name, timestream_name, bucket_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      scope,
      `Printer-Labels-Retry-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: labels_table_name,
          BUCKET_NAME: bucket_name,
          TIMESTREAM_NAME: timestream_name,
          DEAD_LETTER_QUEUE_URL:
            props.sqs_construct.dead_letter_queues.printer_dead_letter_queue
              .queueUrl,
        },
        events: [
          props.sqs_construct.event_sources.printer_dead_letter_event_source,
        ],
        functionName: `printer-labels-retry-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'timestream:*', 's3:*', 'sqs:*'],
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
        reservedConcurrentExecutions: 10,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Printer Labels Retry');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
