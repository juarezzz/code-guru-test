/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { KinesisEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  kinesis_construct: KinesisConstruct;
}

export class KinesisAnalyticsLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { timestream_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      scope,
      `Kinesis-Analytics-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TIMESTREAM_NAME: timestream_name,
        },
        events: [
          new KinesisEventSource(props.kinesis_construct.streams.data_stream, {
            startingPosition: StartingPosition.TRIM_HORIZON,
            batchSize: 100,
            maxBatchingWindow: Duration.seconds(5),
            parallelizationFactor: 10,
            retryAttempts: 3,
            enabled: true,
            reportBatchItemFailures: true,
          }),
        ],
        functionName: `kinesis-analytics-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['timestream:*'],
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
        timeout: Duration.seconds(60),
      },
    );
  }
}
