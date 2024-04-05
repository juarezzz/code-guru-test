/* ---------- External---------- */
import { Artifact } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { VersionedSource } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Build/Source';
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { ArtifactsConstruct } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Artifacts';

interface Props {
  environment: string;
  artifacts: ArtifactsConstruct;
  version_id: string;
  s3_buckets: S3Buckets;
}

export class BuildStage extends Construct {
  public readonly versioned_source: VersionedSource;

  public readonly versioned_source_action: CodeBuildAction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.versioned_source = new VersionedSource(
      this,
      `CrossBrowserVersionedSource-Action-${props.environment}`,
      {
        environment: props.environment,
        source_bucket: props.s3_buckets.logs_bucket.bucketName,
      },
    );

    this.versioned_source_action = new CodeBuildAction({
      actionName: 'Versioned-Source',
      project: this.versioned_source.build,
      input: props.artifacts.source,
      outputs: [
        props.artifacts.brand.input,
        props.artifacts.admin.input,
        props.artifacts.printer.input,
      ],
      environmentVariables: {
        VERSION_ID: { value: props.version_id },
      },
    });
  }
}
