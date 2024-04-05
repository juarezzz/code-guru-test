/* ---------- External ---------- */
import {
  BuildSpec,
  PipelineProject,
  LinuxBuildImage,
} from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class DispatchStageConstruct extends Construct {
  readonly build: PipelineProject;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.build = new PipelineProject(
      this,
      `Pipeline-DispatchStageConstruct-${props.environment}`,
      {
        projectName: `Pipeline-DispatchStageConstruct-${props.environment}`,
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `DispatchStage-Log-Group-${props.environment}`,
              {
                retention: RetentionDays.ONE_WEEK,
                removalPolicy: RemovalPolicy.DESTROY,
              },
            ),
          },
        },
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
        },
        buildSpec: BuildSpec.fromObject({
          version: '0.2',
          phases: {
            build: {
              'on-failure': 'CONTINUE',
              commands: [
                `cd codebuild/output`,
                `read -r COMMIT_HASH < commit_hash.txt`,
                `echo $COMMIT_HASH`,

                'mkdir /s3',

                `cd $CODEBUILD_SRC_DIR_Brand_Output_Artifact_${props.environment}/codebuild/output`,
                'cp brand-report.html brand-summary.txt /s3/',

                `cd $CODEBUILD_SRC_DIR_Admin_Output_Artifact_${props.environment}/codebuild/output`,
                'cp admin-report.html admin-summary.txt /s3/',

                `cd $CODEBUILD_SRC_DIR_Printer_Output_Artifact_${props.environment}/codebuild/output`,
                'cp printer-report.html printer-summary.txt /s3/',

                `cd $CODEBUILD_SRC_DIR_RC_Output_Artifact_${props.environment}/codebuild/output`,
                'cp rc-report.html rc-summary.txt /s3/',
              ],
            },
            post_build: {
              'on-failure': 'ABORT',
              commands: [
                'cd /s3 && zip -r output.zip *',

                `aws s3 cp output.zip s3://${
                  props.s3_buckets.logs_bucket.bucketName
                }/${props.environment.toLowerCase()}/playwright/$COMMIT_HASH/results/output.zip`,

                'exit 1',
              ],
            },
          },
        }),
      },
    );
  }
}
