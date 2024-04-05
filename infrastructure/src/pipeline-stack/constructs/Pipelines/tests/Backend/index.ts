/* ---------- External ---------- */
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';
import { Artifact, Pipeline } from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import {
  CodeBuildAction,
  S3SourceAction,
  S3Trigger,
} from 'aws-cdk-lib/aws-codepipeline-actions';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class BackendTestPipeline extends Construct {
  public readonly artifact: Artifact;

  public readonly pipeline_project: PipelineProject;

  public readonly pipeline: Pipeline;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.artifact = new Artifact();

    /* ----------
     * Creating a pipeline project that
     * installs the dependencies and
     * runs the E2E tests using yarn
     * ---------- */
    this.pipeline_project = new PipelineProject(
      scope,
      `BackendTest-PipelineProject-${props.environment}`,
      {
        projectName: `BackendTest-Pipeline-${props.environment}`,
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `BackendTest-Log-Group-${props.environment}`,
              {
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
              },
            ),
          },
        },
        environment: {
          buildImage: LinuxBuildImage.fromCodeBuildImageId(
            'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
          ),
        },
        buildSpec: BuildSpec.fromObject({
          artifacts: {
            'enable-symlinks': 'yes',
          },
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '18',
              },
            },
            pre_build: {
              'on-failure': 'ABORT',
              commands: [
                'cd $(ls -d */|head -n 1)',
                'cd infrastructure',
                'yarn install',
                'yarn cfn:build',
              ],
            },
            build: {
              'on-failure': 'CONTINUE',
              commands: ['yarn test'],
            },
            post_build: {
              'on-failure': 'ABORT',
              commands: [
                `aws s3 cp output.json s3://${props.s3_buckets.logs_bucket.bucketName}/backend/output.json`,
                `aws s3 cp ./coverage s3://${props.s3_buckets.logs_bucket.bucketName}/backend/coverage --recursive`,
              ],
            },
          },
        }),
      },
    );

    this.pipeline = new Pipeline(
      scope,
      `BackendTest-Pipeline-${props.environment}`,
      {
        pipelineName: `Polytag-BackendTest-${props.environment}`,
        artifactBucket: props.s3_buckets.pipe_artifacts_bucket,
      },
    );

    /* ----------
     * Adding the source and test steps to the pipeline
     * ---------- */
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new S3SourceAction({
          actionName: 'Source',
          bucket: props.s3_buckets.logs_bucket,
          bucketKey: `${props.environment.toLowerCase()}/zip/backend-test.zip`,
          output: this.artifact,
          trigger: S3Trigger.NONE,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'Test',
      actions: [
        new CodeBuildAction({
          actionName: 'Test',
          project: this.pipeline_project,
          input: this.artifact,
        }),
      ],
    });

    /* ----------
     * Granting source bucket access to the pipeline
     * ---------- */
    props.s3_buckets.logs_bucket.grantReadWrite(this.pipeline_project);
  }
}
