/* ---------- External ---------- */
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy } from 'aws-cdk-lib';

/* ---------- Constants ---------- */
import { VARIABLES_LIST } from '_constants/variables-list';

/* ---------- Helpers ---------- */
import { get_parsed_envs, Folders } from '_helpers/pipeline/get-parsed-envs';

interface Props {
  environment: string;
  portal: string;
  folder: Folders;
  teardown_handler_url: string;
  stack: string;
  source_bucket: string;
}

export class TestAction extends Construct {
  readonly build: PipelineProject;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.build = new PipelineProject(
      scope,
      `FrontendTest-${props.portal}Portal-Pipeline-${props.environment}`,
      {
        projectName: `FrontendTest-${props.portal}Portal-Pipeline-${props.environment}`,
        environmentVariables: get_parsed_envs({
          envs_key_list: VARIABLES_LIST,
          folders: [props.folder],
        }),
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `FrontendTest-${props.portal}Portal-Log-Group-${props.environment}`,
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
            install: {
              'runtime-versions': {
                nodejs: '20',
              },
            },

            pre_build: {
              'on-failure': 'CONTINUE',
              commands: [
                `sudo apt-get update`,

                `sudo apt install -y jq`,

                `cd codebuild/output`,

                'COMMIT_HASH=$(cat commit_hash.txt)',

                'echo "$COMMIT_HASH"',

                `echo $backend_modified`,
                `echo $stack_modified`,

                `
                  if [ "$backend_modified" = "false" ] && [ "$stack_modified" = "false" ]; then 
                    echo "Skipping build"

                    touch summary.txt && cp summary.txt /codebuild/output/${props.portal.toLocaleLowerCase()}-summary.txt

                    touch index.html && cp index.html /codebuild/output/${props.portal.toLocaleLowerCase()}-report.html
                  
                  else
                  
                    echo "Running ${props.portal} Portal tests"

                    cd PolytagUK-polytag-mvp-$COMMIT_HASH

                    unzip ${props.folder}.zip -d .

                    sudo apt-get install -y xvfb libgtk2.0-dev libgtk-3-dev libnotify-dev libgconf-2-4 libnss3 libxss1 libasound2

                    sudo apt-get install -y yarn

                    cd ${props.folder}
                    yarn install --frozen-lockfile

                    npx playwright install

                    TEST_ENVIRONMENT=local yarn test:e2e || true

                    curl -X DELETE "${props.teardown_handler_url}"

                    cp summary.txt /codebuild/output/${props.portal.toLocaleLowerCase()}-summary.txt

                    cp playwright-report/index.html /codebuild/output/${props.portal.toLocaleLowerCase()}-report.html

                    DATA_DIR="./playwright-report/data"

                    S3_BUCKET="s3://${props.source_bucket}"

                    COUNTER=1

                    echo $S3_BUCKET
                    
                    if [ -d "$DATA_DIR" ]; then

                      for FILE in "$DATA_DIR"/*; do

                        IMAGE_FILE_NAME="${props.portal.toLocaleLowerCase()}-report-$COUNTER.png"
                          
                        aws s3 cp "$FILE" "$S3_BUCKET/${props.environment.toLowerCase()}/playwright/$COMMIT_HASH/images/$IMAGE_FILE_NAME" 
                          
                        COUNTER=$((COUNTER+1))
                      done

                    else
                        echo "No files found in the directory. Nothing to upload."
                    fi

                    cd /codebuild/output && ls
                  fi
                `,
              ],
            },
          },

          artifacts: {
            name: `${props.portal}_Output_Artifact_${props.environment}`,
            files: [
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-summary.txt`,
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-report.html`,
            ],
            'base-directory': '/codebuild/output',
          },
        }),
      },
    );
  }
}
