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
      `VersionedSource-Pipeline-${props.environment}`,
      {
        projectName: `VersionedSource-Pipeline-${props.environment}`,
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `VersionedSource-Log-Group-${props.environment}`,
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
                `echo $VERSION_ID`,
                `export VERSION_ID=$VERSION_ID`,

                `bucket=${props.source_bucket}`,
                `object_key=${props.environment.toLowerCase()}/zip/frontend-test.zip`,

                `echo $reporter_file`,
                `echo $bucket`,
                `echo $object_key`,

                `aws s3api get-object --bucket $bucket --key $object_key --version-id $VERSION_ID /codebuild/output/frontend-test.zip`,

                `# Retrieve metadata from an object`,
                `COMMIT_HASH=$(aws s3api head-object --bucket $bucket --key $object_key --version-id $VERSION_ID | jq -r '.Metadata.sha')`,

                'echo "$COMMIT_HASH" > commit_hash.txt',

                `mv commit_hash.txt /codebuild/output`,

                `cd /codebuild/output && ls`,

                `cat commit_hash.txt`,

                `unzip frontend-test.zip -d .`,

                `cd PolytagUK-polytag-mvp-$COMMIT_HASH`,

                `zip -r web.zip web`,
                `zip -r web-admin.zip web-admin`,
                `zip -r web-printer-portal.zip web-printer-portal`,
                `zip -r web-rc-portal.zip web-rc-portal`,
              ],
            },
          },

          artifacts: {
            'secondary-artifacts': {
              [`Brand_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Brand_Artifact_${props.environment}`,
              },

              [`Admin_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web-admin.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Admin_Artifact_${props.environment}`,
              },

              [`Printer_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web-printer-portal.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `Printer_Artifact_${props.environment}`,
              },

              [`RC_Artifact_${props.environment}`]: {
                files: [
                  '/codebuild/output/PolytagUK-polytag-mvp-*/web-rc-portal.zip',
                  '/codebuild/output/commit_hash.txt',
                ],
                name: `RC_Artifact_${props.environment}`,
              },
            },
          },
        }),
      },
    );
  }
}
