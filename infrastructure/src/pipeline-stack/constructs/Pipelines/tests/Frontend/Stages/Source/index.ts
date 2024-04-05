/* ---------- External ---------- */
import { Artifact } from 'aws-cdk-lib/aws-codepipeline';
import {
  S3SourceAction,
  S3Trigger,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

interface Props {
  environment: string;
  s3_buckets: S3Buckets;
  source_artifact: Artifact;
}

export class SourceStageConstruct extends Construct {
  public readonly action: S3SourceAction;

  public readonly get_version_id: () => string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.action = new S3SourceAction({
      actionName: 'Source',
      bucket: props.s3_buckets.logs_bucket,
      bucketKey: `${props.environment.toLowerCase()}/zip/frontend-test.zip`,
      output: props.source_artifact,
      trigger: S3Trigger.NONE,
    });

    this.get_version_id = () => {
      return this.action.variables.versionId;
    };
  }
}
