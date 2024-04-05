/* ---------- External ---------- */
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

interface Queues {
  printer_queue: Queue;
  labels_queue: Queue;
}

interface DeadLetterQueues {
  printer_dead_letter_queue: Queue;
}

interface EventSources {
  printer_event_source: SqsEventSource;
  labels_event_source: SqsEventSource;
  printer_dead_letter_event_source: SqsEventSource;
}

export class SQSConstruct extends Construct {
  public readonly dead_letter_queues: DeadLetterQueues;

  public readonly event_sources: EventSources;

  public readonly queues: Queues;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.dead_letter_queues = {
      printer_dead_letter_queue: new Queue(
        scope,
        `Printer-DeadLetter-Queue-${props.environment}`,
        {
          queueName: `printer-dead-letter-queue-${props.environment}`,
          removalPolicy: RemovalPolicy.DESTROY,
          visibilityTimeout: Duration.seconds(240),
        },
      ),
    };

    this.queues = {
      printer_queue: new Queue(scope, `Printer-Queue-${props.environment}`, {
        queueName: `printer-queue-${props.environment}`,
        removalPolicy: RemovalPolicy.DESTROY,
        deadLetterQueue: {
          queue: this.dead_letter_queues.printer_dead_letter_queue,
          maxReceiveCount: 1,
        },
        visibilityTimeout: Duration.seconds(240),
      }),
      labels_queue: new Queue(scope, `Labels-Queue-${props.environment}`, {
        queueName: `labels-queue-${props.environment}`,
        removalPolicy: RemovalPolicy.DESTROY,
        visibilityTimeout: Duration.seconds(240),
      }),
    };

    this.event_sources = {
      printer_event_source: new SqsEventSource(this.queues.printer_queue, {
        maxConcurrency: 10,
        enabled: true,
        batchSize: 1,
      }),
      printer_dead_letter_event_source: new SqsEventSource(
        this.dead_letter_queues.printer_dead_letter_queue,
        {
          maxConcurrency: 10,
          enabled: true,
          batchSize: 1,
        },
      ),
      labels_event_source: new SqsEventSource(this.queues.labels_queue, {
        enabled: true,
        batchSize: 1,
      }),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.dead_letter_queues.printer_dead_letter_queue).add(
      'Custom:Service',
      'SQS',
    );
    Tags.of(this.dead_letter_queues.printer_dead_letter_queue).add(
      'Custom:Environment',
      props.environment,
    );

    Tags.of(this.queues.printer_queue).add('Custom:Service', 'SQS');
    Tags.of(this.queues.printer_queue).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
