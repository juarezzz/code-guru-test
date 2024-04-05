/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Pipeline, PipelineType } from 'aws-cdk-lib/aws-codepipeline';
import { CodeBuildAction } from 'aws-cdk-lib/aws-codepipeline-actions';
import { SecretValue, Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { ArtifactsConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Artifacts';
import { SourceStageConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Stages/Source';
import { BuildStageConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Stages/Build';
import { DispatchStageConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Stages/Dispatch';
import { TestStageConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Stages/Test';
import { VariablesConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Variables';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class FrontendTestPipeline extends Construct {
  public readonly pipeline: Pipeline;

  public readonly token: SecretValue;

  public readonly variables: VariablesConstruct;

  /* ---------- Artifacts ---------- */

  public readonly artifacts: ArtifactsConstruct;

  /* ---------- Source ---------- */

  public readonly source_action: SourceStageConstruct;

  public readonly build_stage: BuildStageConstruct;

  /* ---------- Build actions ---------- */

  public readonly test_stage: TestStageConstruct;

  public readonly dispatch: DispatchStageConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { secret_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.token = SecretValue.secretsManager(secret_name, {
      jsonField: 'GITHUB_TOKEN',
    });

    this.artifacts = new ArtifactsConstruct(
      this,
      `ArtifactsConstruct-Pipeline-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    /* ----------
     * Creating Pipeline Construct
     * ---------- */

    this.variables = new VariablesConstruct(
      this,
      `FrontendTest-Variables-${props.environment}`,
    );

    this.pipeline = new Pipeline(
      this,
      `FrontendTest-Pipeline-${props.environment}`,
      {
        pipelineName: `Polytag-FrontendTest-${props.environment}`,
        artifactBucket: props.s3_buckets.pipe_artifacts_bucket,
        pipelineType: PipelineType.V2,
        variables: this.variables.array,
      },
    );

    this.source_action = new SourceStageConstruct(
      this,
      `SourceActions-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        source_artifact: this.artifacts.source,
      },
    );

    /* ----------
     * Creating Stage to download version source from S3
     * ---------- */

    this.build_stage = new BuildStageConstruct(
      this,
      `BuildStage-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
        artifacts: this.artifacts,
        version_id: this.source_action.get_version_id(),
      },
    );

    /* ----------
     * Test Stage (Brand, Admin, Printer and RC Portal)
     * ---------- */

    this.test_stage = new TestStageConstruct(
      this,
      `TestBuildActions-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        artifacts: this.artifacts,
        s3_buckets: props.s3_buckets,
        variables: this.variables,
      },
    );

    this.dispatch = new DispatchStageConstruct(
      this,
      `DispatchStageConstruct-Pipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    /* ----------
     * Adding the source Stage
     * ---------- */

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [this.source_action.action],
    });

    /* ----------
     * Adding the Build Stage
     * ---------- */

    this.pipeline.addStage({
      stageName: 'Build',
      actions: [this.build_stage.versioned_source_action],
    });

    /* ----------
     * Adding the E2E Test Stages
     * ---------- */

    this.pipeline.addStage({
      stageName: 'Test',
      actions: this.test_stage.actions.map(
        action => new CodeBuildAction(action),
      ),
    });

    /* ----------
     * Adding the Dispatch Stage to upload the reports to s3
     * ---------- */

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
            this.artifacts.rc.output,
          ],
          runOrder: 1,
        }),
      ],
    });

    /* ----------
     * Granting source bucket access to the pipeline
     * ---------- */

    props.s3_buckets.logs_bucket.grantWrite(
      this.test_stage.tests.brand_portal_stage.build,
    );

    props.s3_buckets.logs_bucket.grantWrite(
      this.test_stage.tests.admin_portal_stage.build,
    );

    props.s3_buckets.logs_bucket.grantWrite(
      this.test_stage.tests.printer_portal_stage.build,
    );

    props.s3_buckets.logs_bucket.grantWrite(
      this.test_stage.tests.rc_portal_stage.build,
    );

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
    Tags.of(this.test_stage.tests.admin_portal_stage).add(
      'Custom:Build',
      'Admin',
    );
    Tags.of(this.test_stage.tests.brand_portal_stage).add(
      'Custom:Build',
      'Brand',
    );
    Tags.of(this.test_stage.tests.rc_portal_stage).add(
      'Custom:Build',
      'RC Portal',
    );
    Tags.of(this.test_stage.tests.printer_portal_stage).add(
      'Custom:Build',
      'Printer',
    );
    Tags.of(this.dispatch.build).add('Custom:Build', 'Dispatch');

    Tags.of(this.pipeline).add('Custom:Environment', props.environment);
  }
}
