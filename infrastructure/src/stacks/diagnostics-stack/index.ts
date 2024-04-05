/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { TimestreamConstruct } from '_stacks/diagnostics-stack/constructs/Timestream';
import { ScheduledEventsConstruct } from '_stacks/diagnostics-stack/constructs/Events';
import { BucketsConstruct } from '_stacks/diagnostics-stack/constructs/Buckets';
import { LayersConstruct } from '_stacks/diagnostics-stack/constructs/Layers';
import { SQSConstruct } from '_stacks/diagnostics-stack/constructs/SQS';
import { LambdasConstruct } from '_stacks/diagnostics-stack/constructs/Lambdas';

/* ---------- Interfaces ---------- */
interface Props extends StackProps {
  environment: string;
}

export class DiagnosticsStack extends Stack {
  public readonly scheduled_events_construct: ScheduledEventsConstruct;

  public readonly layers_construct: LayersConstruct;

  public readonly timestream_construct: TimestreamConstruct;

  public readonly sqs_construct: SQSConstruct;

  public readonly buckets_construct: BucketsConstruct;

  public readonly lambdas_construct: LambdasConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.layers_construct = new LayersConstruct(
      this,
      `Layers-Construct-${props.environment}-DIAGNOSTICS`,
      {
        environment: props.environment,
      },
    );

    this.buckets_construct = new BucketsConstruct(
      this,
      `Buckets-Construct-${props.environment}-DIAGNOSTICS`,
      { environment: props.environment },
    );

    this.timestream_construct = new TimestreamConstruct(
      this,
      `Timestream-Logs-Construct-${props.environment}-DIAGNOSTICS`,
      {
        environment: props.environment,
      },
    );

    this.sqs_construct = new SQSConstruct(
      this,
      `SQS-Construct-${props.environment}-DIAGNOSTICS`,
      { environment: props.environment },
    );

    this.lambdas_construct = new LambdasConstruct(
      this,
      `Lambdas-Construct-${props.environment}-DIAGNOSTICS`,
      {
        environment: props.environment,
        sqs_construct: this.sqs_construct,
        timestream_contruct: this.timestream_construct,
      },
    );

    this.scheduled_events_construct = new ScheduledEventsConstruct(
      this,
      `ScheduledEvents-Contruct-${props.environment}-DIAGNOSTICS`,
      {
        environment: props.environment,
        layers_construct: this.layers_construct,
        buckets_construct: this.buckets_construct,
      },
    );
  }
}
