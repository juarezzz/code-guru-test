/* eslint-disable no-template-curly-in-string */
/* ---------- External ---------- */
import { RemovalPolicy } from 'aws-cdk-lib';
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface Props {
  environment: string;
  source_bucket: string;
}

export class VersionedSource extends Construct {
  readonly build: PipelineProject;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.build = new PipelineProject(
      scope,
      `CrossBrowserVersionedSource-Pipeline-${props.environment}`,
      {
        projectName: `CrossBrowserVersionedSource-Pipeline-${props.environment}`,
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `CrossBrowserVersionedSource-Log-Group-${props.environment}`,
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
          version: '0.2',
          phases: {
            install: {
              'runtime-versions': {
                nodejs: '18',
              },
            },
            pre_build: {
              'on-failure': 'CONTINUE',
              commands: [
                'echo $VERSION_ID',
                'export VERSION_ID=$VERSION_ID',

                `bucket=${props.source_bucket}`,
                `object_key=${props.environment.toLowerCase()}/zip/frontend-release.zip`,

                `aws s3api get-object --bucket $bucket --key $object_key --version-id $VERSION_ID /codebuild/output/frontend-release.zip`,

                `# Retrieve metadata from an object`,
                `COMMIT_HASH=$(aws s3api head-object --bucket $bucket --key $object_key --version-id $VERSION_ID | jq -r '.Metadata.sha')`,

                `echo "$COMMIT_HASH" > /codebuild/output/commit_hash.txt`,

                'cd /codebuild/output && ls',

                'unzip frontend-release.zip -d .',

                'cd PolytagUK-polytag-mvp-*',

                'zip -r web.zip web',
                'zip -r web-admin.zip web-admin',
                'zip -r web-printer-portal.zip web-printer-portal',
                'zip -r web-rc-portal.zip web-rc-portal',
              ],
            },
          },

          artifacts: {
            'secondary-artifacts': {
              [`CrossBrowser_Brand_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Brand_Artifact_${props.environment}`,
              },

              [`CrossBrowser_Admin_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web-admin.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Admin_Artifact_${props.environment}`,
              },

              [`CrossBrowser_Printer_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web-printer-portal.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Printer_Artifact_${props.environment}`,
              },
            },
          },
        }),
      },
    );
  }
}
