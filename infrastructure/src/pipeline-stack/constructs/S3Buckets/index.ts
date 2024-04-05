/* ---------- External ---------- */
import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { S3EventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Bucket, EventType } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/* ---------- Lambdas ---------- */
import { LogsBucketOutputLambda } from '_pipeline-stack/lambdas/events/logs-bucket-output';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class S3Buckets extends Construct {
  public readonly logs_bucket: Bucket;

  public readonly pipe_artifacts_bucket: Bucket;

  public readonly inspector_output_bucket: Bucket;

  public readonly logs_bucket_output_lambda: LogsBucketOutputLambda;

  public readonly logs_bucket_event_source: S3EventSource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.pipe_artifacts_bucket = new Bucket(
      scope,
      `PipelineArtifactsBucket-${props.environment}-Pipe`,
      {
        bucketName: `polytag-pipeline-artifacts-bucket-${props.environment.toLowerCase()}`,
        removalPolicy: RemovalPolicy.DESTROY,
        publicReadAccess: false,
      },
    );

    this.inspector_output_bucket = new Bucket(
      scope,
      `InspectorBucket-${props.environment}`,
      {
        bucketName: `inspector-output-bucket-${props.environment.toLowerCase()}`,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        publicReadAccess: false,
        versioned: true,
        lifecycleRules: [
          {
            expiration: Duration.days(7),
            enabled: true,
          },
        ],
      },
    );

    this.logs_bucket = new Bucket(
      scope,
      `LogsBucket-${props.environment}-Pipe`,
      {
        bucketName: `polytag-pipeline-source-bucket-${props.environment.toLowerCase()}`,
        autoDeleteObjects: true,
        removalPolicy: RemovalPolicy.DESTROY,
        publicReadAccess: false,
        versioned: true,
        lifecycleRules: [
          {
            expiration: Duration.days(7),
            enabled: true,
          },
        ],
      },
    );

    this.logs_bucket_output_lambda = new LogsBucketOutputLambda(
      scope,
      `LogsBucketOutputLambda-${props.environment}`,
      {
        environment: props.environment,
        bucket_event_source: this.logs_bucket,
      },
    );

    this.logs_bucket_event_source = new S3EventSource(this.logs_bucket, {
      events: [EventType.OBJECT_CREATED],
      filters: [
        {
          prefix: `${props.environment.toLowerCase()}/playwright/`,
          suffix: '.zip',
        },
      ],
    });

    this.logs_bucket_output_lambda.function.addEventSource(
      this.logs_bucket_event_source,
    );

    /* ---------- Tags ---------- */
    Tags.of(this.pipe_artifacts_bucket).add('Custom:Service', 'S3');
    Tags.of(this.pipe_artifacts_bucket).add('Custom:Bucket', 'Pipe Artifacts');
    Tags.of(this.pipe_artifacts_bucket).add(
      'Custom:Environment',
      props.environment,
    );

    Tags.of(this.logs_bucket).add('Custom:Service', 'S3');
    Tags.of(this.logs_bucket).add('Custom:Bucket', 'Logs Bucket');
    Tags.of(this.logs_bucket).add('Custom:Environment', props.environment);
  }
}
