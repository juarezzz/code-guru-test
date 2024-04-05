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

export class FrontendDeployPipeline extends Construct {
  public readonly artifact: Artifact;

  public readonly target_environment: Variable;

  public readonly pipeline_project: PipelineProject;

  public readonly pipeline: Pipeline;

  public readonly secret_name: string;

  public readonly roles: PipelineRoles;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.roles = new PipelineRoles(
      this,
      `FrontendDeploy-Roles-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    this.target_environment = new Variable({
      variableName: 'target_environment',
      defaultValue: 'STG',
    });

    this.artifact = new Artifact();

    this.secret_name = this.node.tryGetContext(props.environment).secret_name;

    /* ----------
     * Creating a pipeline project that
     * installs the dependencies and calls
     * CDK deploy on the target stack(s)
     * ---------- */

    this.pipeline_project = new PipelineProject(
      scope,
      `FrontendDeploy-PipelineProject-${props.environment}`,
      {
        projectName: `FrontendDeploy-Pipeline-${props.environment}`,
        environmentVariables: get_parsed_envs({ folders: ['infra', 'web'] }),
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
              `FrontendDeploy-Log-Group-${props.environment}`,
              {
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
              },
            ),
          },
        },
        buildSpec: BuildSpec.fromObject({
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
                'cd web',
                'yarn install --frozen-lockfile',
                'cd ../infrastructure',
                'yarn install --frozen-lockfile',
              ],
            },
            build: {
              'on-failure': 'CONTINUE',
              commands: [
                `echo $target_environment`,
                `echo "Deploying Frontend Stack to $target_environment environment"`,
                `npx cdk deploy --all -c choice=WEB-$target_environment -c pipeline=true --require-approval never`,
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
                  --payload '{"success": '"$success"', "stack": "Frontend", "environment": "'"$target_environment"'"}' \
                  response.json
            `,
              ],
            },
          },
        }),
        role: this.roles.codebuild,
      },
    );

    this.pipeline = new Pipeline(
      scope,
      `FrontendDeploy-Pipeline-${props.environment}`,
      {
        pipelineName: `Polytag-FrontendDeploy-${props.environment}`,
        artifactBucket: props.s3_buckets.pipe_artifacts_bucket,
        pipelineType: PipelineType.V2,
        variables: [this.target_environment],
      },
    );

    /* ----------
     * Adding the source and build steps to the pipeline
     * ---------- */
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
    Tags.of(this.pipeline).add('Custom:Pipeline', 'Frontend');
    Tags.of(this.pipeline).add('Custom:Environment', props.environment);

    Tags.of(this.pipeline_project).add('Custom:Service', 'Codebuild');
    Tags.of(this.pipeline_project).add('Custom:Pipeline', 'Frontend');
    Tags.of(this.pipeline_project).add('Custom:Environment', props.environment);
  }
}
