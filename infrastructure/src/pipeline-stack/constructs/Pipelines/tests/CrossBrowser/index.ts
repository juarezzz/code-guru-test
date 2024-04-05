/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import {
  CodeBuildAction,
  CodeBuildActionProps,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { BrowserEnvironmentStage } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Stages/BrowserEnvironmentStage';
import { ArtifactsConstruct } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Artifacts';
import { SourceStage } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Stages/Source';
import { BuildStage } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Stages/Build';
import { DispatchStageConstruct } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Stages/Dispatch';

interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class CrossBrowserTestPipeline extends Construct {
  public readonly pipeline: Pipeline;

  public readonly artifacts: ArtifactsConstruct;

  public readonly source_action: SourceStage;

  public readonly build_stage: BuildStage;

  public readonly actions: CodeBuildActionProps[];

  public readonly browser_environment: BrowserEnvironmentStage;

  public readonly dispatch: DispatchStageConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.pipeline = new Pipeline(
      this,
      `CrossBrowserTest-Pipeline-${props.environment}`,
      {
        pipelineName: `Polytag-CrossBrowserTest-${props.environment}`,
      },
    );

    this.artifacts = new ArtifactsConstruct(
      this,
      `CrossBrowserArtifacts-Pipeline-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    /* ---------- Stages Construct ---------- */

    this.source_action = new SourceStage(
      this,
      `CrossBrowserSourceAction-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        source_artifact: this.artifacts.source,
      },
    );

    this.build_stage = new BuildStage(
      this,
      `CrossBrowserBuildStage-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        artifacts: this.artifacts,
        s3_buckets: props.s3_buckets,
        version_id: this.source_action.get_version_id(),
      },
    );

    this.browser_environment = new BrowserEnvironmentStage(
      this,
      `CrossBrowserTestStages-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        artifacts: this.artifacts,
      },
    );

    this.dispatch = new DispatchStageConstruct(
      this,
      `CrossBrowserDispatch-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    /* ---------- Add Stages ---------- */

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [this.source_action.action],
    });

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [this.build_stage.versioned_source_action],
    });

    this.pipeline.addStage({
      stageName: 'Cross-Browser-Test',
      actions: this.browser_environment.actions.map(
        action => new CodeBuildAction(action),
      ),
    });

    this.pipeline.addStage({
      stageName: 'Dispatch',
      actions: [
        new CodeBuildAction({
          actionName: 'Upload',
          project: this.dispatch.build,
          input: this.artifacts.brand.input,
          extraInputs: [
            this.artifacts.brand.output,
            this.artifacts.admin.output,
            this.artifacts.printer.output,
          ],
          runOrder: 1,
        }),
      ],
    });

    props.s3_buckets.logs_bucket.grantReadWrite(this.dispatch.build);

    props.s3_buckets.logs_bucket.grantReadWrite(
      this.build_stage.versioned_source.build,
    );

    /* ---------- Tags ---------- */
    Tags.of(this.pipeline).add('Custom:Service', 'Codepipeline');
    Tags.of(this.pipeline).add('Custom:Pipeline', 'Frontend Test');

    Tags.of(this.build_stage.versioned_source.build).add(
      'Custom:Build',
      'Build',
    );
    Tags.of(this.browser_environment.tests.brand.action.build).add(
      'Custom:Build',
      'Admin',
    );
    Tags.of(this.browser_environment.tests.admin.action.build).add(
      'Custom:Build',
      'Brand',
    );
    Tags.of(this.browser_environment.tests.printer.action.build).add(
      'Custom:Build',
      'Printer',
    );
    Tags.of(this.dispatch.build).add('Custom:Build', 'Dispatch');

    Tags.of(this.pipeline).add('Custom:Environment', props.environment);
  }
}
