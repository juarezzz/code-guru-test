/* ---------- External ---------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/diagnostics-stack/constructs/Buckets';

/* ---------- Types ---------- */
import { Layers } from '_stacks/diagnostics-stack/constructs/Layers/@types';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  buckets_construct: BucketsConstruct;
}

export class PingEventLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, resolver_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      scope,
      `Cloudwatch-PingEvent-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        memorySize: 1024,
        functionName: `ping-event-${props.environment.toLowerCase()}`,
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
          RESOLVER_URL: resolver_url,
          ENVIRONMENT: props.environment,
          BUCKET_NAME:
            props.buckets_construct.buckets.diagnostics_bucket.bucketName,
          BUCKET_URL:
            props.buckets_construct.buckets.diagnostics_bucket.urlForObject(),
          SLACK_CHANNEL_URL: process.env.SLACK_CHANNEL_URL as string,
        },
        bundling: {
          externalModules: [
            'chrome-aws-lambda',
            '@playwright/test',
            'aws-lambda',
            'aws-sdk',
          ],
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 's3:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers.playwright_lambda, props.layers.aws_lambda],
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Action', 'Cloudwatch');
    Tags.of(this.function).add('Custom:Event', 'Ping');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
