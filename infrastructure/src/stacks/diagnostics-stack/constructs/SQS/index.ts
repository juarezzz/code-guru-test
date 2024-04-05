/* ---------- External ---------- */
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

interface Queues {
  logs_queue: Queue;
}

interface EventSources {
  logs_event_source: SqsEventSource;
}

export class SQSConstruct extends Construct {
  public readonly event_sources: EventSources;

  public readonly queues: Queues;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { logs_queue_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.queues = {
      logs_queue: new Queue(scope, `Logs-Queue-${props.environment}`, {
        queueName: `${logs_queue_name}-${props.environment}`,
        removalPolicy: RemovalPolicy.DESTROY,
        visibilityTimeout: Duration.seconds(240),
        retentionPeriod: Duration.hours(6),
      }),
    };

    this.event_sources = {
      logs_event_source: new SqsEventSource(this.queues.logs_queue, {
        enabled: true,
        reportBatchItemFailures: true,
        maxBatchingWindow: Duration.seconds(30),
        batchSize: 20,
      }),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.queues.logs_queue).add('Custom:Service', 'SQS');
    Tags.of(this.queues.logs_queue).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
