/* ---------- External ---------- */
import { BuildSpec, PipelineProject } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

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
      `CrossBrowser-Pipeline-DispatchStage-${props.environment}`,
      {
        projectName: `CrossBrowser-Pipeline-DispatchStage-${props.environment}`,
        buildSpec: BuildSpec.fromObject({
          version: '0.2',
          phases: {
            build: {
              'on-failure': 'CONTINUE',
              commands: [
                'cd codebuild/output',

                'cat commit_hash.txt',

                `read -r HASH < text.txt`,

                'mkdir /s3',

                `cd $CODEBUILD_SRC_DIR_CrossBrowser_Brand_Output_Artifact_${props.environment}/codebuild/output`,
                'cp brand-chrome-summary.txt brand-chrome-report.html /s3/',
                'cp brand-safari-summary.txt brand-safari-report.html /s3/',
                'cp brand-firefox-summary.txt brand-firefox-report.html /s3/',

                `cd $CODEBUILD_SRC_DIR_CrossBrowser_Admin_Output_Artifact_${props.environment}/codebuild/output`,
                'cp admin-chrome-summary.txt admin-chrome-report.html /s3/',
                'cp admin-safari-summary.txt admin-safari-report.html /s3/',
                'cp admin-firefox-summary.txt admin-firefox-report.html /s3/',

                `cd $CODEBUILD_SRC_DIR_CrossBrowser_Printer_Output_Artifact_${props.environment}/codebuild/output`,
                'cp printer-chrome-summary.txt printer-chrome-report.html /s3/',
                'cp printer-safari-summary.txt printer-safari-report.html /s3/',
                'cp printer-firefox-summary.txt printer-firefox-report.html /s3/',
              ],
            },
            post_build: {
              'on-failure': 'ABORT',
              commands: [
                'cd /s3 && zip -r release-output.zip *',

                `aws s3 cp output.zip s3://${
                  props.s3_buckets.logs_bucket.bucketName
                }/${props.environment.toLowerCase()}/playwright/$COMMIT_HASH/results/release-output.zip`,

                'exit 1',
              ],
            },
          },
        }),
      },
    );
  }
}
