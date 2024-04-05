/* ---------- External ---------- */
import { Tags } from 'aws-cdk-lib';
import { Stream, StreamMode } from 'aws-cdk-lib/aws-kinesis';
import { Construct } from 'constructs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

interface Streams {
  data_stream: Stream;
}

export class KinesisConstruct extends Construct {
  public readonly streams: Streams;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.streams = {
      data_stream: new Stream(
        scope,
        `Analytics-DataStream-${props.environment}`,
        {
          streamName: `Analytics-DataStream-${props.environment}`,
          streamMode: StreamMode.ON_DEMAND,
        },
      ),
    };

    /* ---------- Tags ---------- */
    Tags.of(this.streams.data_stream).add('Custom:Service', 'Kinesis');
    Tags.of(this.streams.data_stream).add(
      'Custom:Environment',
      props.environment,
    );
  }
}
