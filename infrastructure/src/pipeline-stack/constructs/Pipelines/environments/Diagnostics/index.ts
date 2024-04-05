/* ---------- External ---------- */
import {
  BuildSpec,
  ComputeType,
  LinuxBuildImage,
  PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';
import {
  Artifact,
  Pipeline,
  PipelineType,
  Variable,
} from 'aws-cdk-lib/aws-codepipeline';
import { Construct } from 'constructs';
import {
  CodeBuildAction,
  S3SourceAction,
  S3Trigger,
} from 'aws-cdk-lib/aws-codepipeline-actions';
import { RemovalPolicy, Tags } from 'aws-cdk-lib';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { PipelineRoles } from '_pipeline-stack/constructs/Roles';

/* ---------- Helpers ---------- */
import { get_parsed_envs } from '_helpers/pipeline/get-parsed-envs';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class DiagnosticsDeployPipeline extends Construct {
  public readonly artifact: Artifact;

  public readonly target_environment: Variable;

  public readonly pipeline_project: PipelineProject;

  public readonly pipeline: Pipeline;

  public readonly roles: PipelineRoles;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.roles = new PipelineRoles(
      this,
      `DiagnosticsDeploy-Roles-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    this.target_environment = new Variable({
      variableName: 'target_environment',
      defaultValue: 'STG',
    });

    this.artifact = new Artifact();

    /* ----------
     * Creating a pipeline project that
     * installs the dependencies and calls
     * CDK deploy on the target stack(s)
     * ---------- */

    this.pipeline_project = new PipelineProject(
      scope,
      `DiagnosticsDeploy-PipelineProject-${props.environment}`,
      {
        projectName: `DiagnosticsDeploy-Pipeline-${props.environment}`,
        environmentVariables: get_parsed_envs({ folders: ['infra'] }),
        environment: {
          buildImage: LinuxBuildImage.fromCodeBuildImageId(
            'aws/codebuild/amazonlinux2-x86_64-standard:5.0',
          ),
          computeType: ComputeType.MEDIUM,
        },
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `DiagnosticsDeploy-Log-Group-${props.environment}`,
              {
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
              },
            ),
          },
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
                'yarn global add node-gyp',
                'cd $(ls -d */|head -n 1)',
                'cd infrastructure',
                'yarn install --frozen-lockfile',

                // Installing layers dependencies
                'cd src/stacks/layers',
                'chmod +x install_deps.sh',
                './install_deps.sh ',
                'cd ../../..',
              ],
            },
            build: {
              'on-failure': 'CONTINUE',
              commands: [
                `echo $target_environment`,
                `echo "Deploying Frontend Stack to $target_environment environment"`,
                `npx cdk deploy --all -c choice=DIAGNOSTICS-$target_environment -c pipeline=true --require-approval never`,
              ],
            },

            post_build: {
              'on-failure': 'CONTINUE',
              commands: [
                `
                if [ "$CODEBUILD_BUILD_SUCCEEDING" == "1" ]; then
                  success=true
                else
                  success=false
                fi

                aws lambda invoke \
                  --function-name deployment-notification-${props.environment.toLowerCase()} \
                  --invocation-type Event \
                  --cli-binary-format raw-in-base64-out \
                  --payload '{"success": '"$success"', "stack": "Diagnostic", "environment": "'"$target_environment"'"}' \
                  response.json
            `,
              ],
            },
          },
        }),
        role: this.roles.codebuild,
      },
    );

    /* ----------
     * Adding the source and build steps to the pipeline
     * ---------- */
    this.pipeline = new Pipeline(
      scope,
      `DiagnosticsDeploy-Pipeline-${props.environment}`,
      {
        pipelineName: `Polytag-DiagnosticsDeploy-${props.environment}`,
        artifactBucket: props.s3_buckets.pipe_artifacts_bucket,
        pipelineType: PipelineType.V2,
        variables: [this.target_environment],
      },
    );

    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new S3SourceAction({
          actionName: 'Source',
          bucket: props.s3_buckets.logs_bucket,
          bucketKey: `${props.environment.toLowerCase()}/zip/project.zip`,
          output: this.artifact,
          trigger: S3Trigger.NONE,
        }),
      ],
    });

    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new CodeBuildAction({
          actionName: 'Deploy',
          project: this.pipeline_project,
          input: this.artifact,
          environmentVariables: {
            target_environment: {
              value: this.target_environment.reference(),
            },
          },
        }),
      ],
    });

    /* ----------
     * Granting source bucket access to the pipeline
     * ---------- */
    props.s3_buckets.logs_bucket.grantReadWrite(this.pipeline_project);

    /* ---------- Tags ---------- */
    Tags.of(this.pipeline).add('Custom:Service', 'Codepipeline');
    Tags.of(this.pipeline).add('Custom:Pipeline', 'Diagnostics');
    Tags.of(this.pipeline).add('Custom:Environment', props.environment);

    Tags.of(this.pipeline_project).add('Custom:Service', 'Codebuild');
    Tags.of(this.pipeline_project).add('Custom:Pipeline', 'Diagnostics');
    Tags.of(this.pipeline_project).add('Custom:Environment', props.environment);
  }
}
