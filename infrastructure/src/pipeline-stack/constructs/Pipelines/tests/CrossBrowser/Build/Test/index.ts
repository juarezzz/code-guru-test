/* eslint-disable no-template-curly-in-string */
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
import { get_parsed_envs, Portals } from '_helpers/pipeline/get-parsed-envs';

interface Props {
  environment: string;
  portal: string;
  folder: Portals;
  domain_name: string;
  teardown_handler_url: string;
}

export class BuildAction extends Construct {
  readonly build: PipelineProject;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.build = new PipelineProject(
      scope,
      `CrossBrowserTest-${props.portal}Portal-Pipeline-${props.environment}`,
      {
        projectName: `CrossBrowserTest-${props.portal}Portal-Pipeline-${props.environment}`,
        environmentVariables: get_parsed_envs({
          envs_key_list: VARIABLES_LIST,
          folders: [props.folder],
        }),
        environment: {
          buildImage: LinuxBuildImage.STANDARD_7_0,
        },
        logging: {
          cloudWatch: {
            logGroup: new LogGroup(
              this,
              `CrossBrowserTest-${props.portal}Portal-Log-Group-${props.environment}`,
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
                nodejs: '20',
              },
            },

            pre_build: {
              'on-failure': 'CONTINUE',
              commands: [
                'cd codebuild/output',

                'export LT_USERNAME=$LT_USERNAME',
                'export LT_ACCESS_KEY=$LT_ACCESS_KEY',

                'echo $LT_USERNAME',
                'echo $LT_ACCESS_KEY',

                'cd PolytagUK-polytag-mvp-*',
                `unzip ${props.folder}.zip -d .`,

                'yum install -y xorg-x11-server-Xvfb gtk3-devel libnotify-devel nss libXScrnSaver alsa-lib',

                `cd ${props.folder}`,
                'yarn install --frozen-lockfile',

                'npx playwright install',
              ],
            },

            build: {
              'on-failure': 'CONTINUE',
              commands: [
                'export TEST_ENVIRONMENT=sdk',
                `export BASE_URL=${props.domain_name}`,
                'export LT_USERNAME=$LT_USERNAME',
                'export LT_ACCESS_KEY=$LT_ACCESS_KEY',

                `TEST_NAME=${props.portal}PipelineChromium BROWSER_NAME=pw-chromium yarn test:e2e || true`,

                `cp summary.txt /codebuild/output/${props.portal.toLocaleLowerCase()}-chrome-summary.txt`,
                `cp playwright-report/index.html /codebuild/output/${props.portal.toLocaleLowerCase()}-chrome-report.html`,

                `curl -X DELETE "${props.teardown_handler_url}"`,

                `TEST_NAME=${props.portal}PipelineFirefox BROWSER_NAME=pw-firefox yarn test:e2e || true`,

                `cp summary.txt /codebuild/output/${props.portal.toLocaleLowerCase()}-firefox-summary.txt`,
                `cp playwright-report/index.html /codebuild/output/${props.portal.toLocaleLowerCase()}-firefox-report.html`,

                `curl -X DELETE "${props.teardown_handler_url}"`,

                `TEST_NAME=${props.portal}PipelineWebkit BROWSER_NAME=pw-webkit yarn test:e2e || true`,

                `cp summary.txt /codebuild/output/${props.portal.toLocaleLowerCase()}-safari-summary.txt`,
                `cp playwright-report/index.html /codebuild/output/${props.portal.toLocaleLowerCase()}-safari-report.html`,

                `curl -X DELETE "${props.teardown_handler_url}"`,
              ],
            },

            post_build: {
              'on-failure': 'CONTINUE',
              commands: ['cd /codebuild/output && ls'],
            },
          },

          artifacts: {
            name: `CrossBrowser_${props.portal}_Output_Artifact_${props.environment}`,
            files: [
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-chrome-summary.txt`,
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-chrome-report.html`,

              `/codebuild/output/${props.portal.toLocaleLowerCase()}-firefox-summary.txt`,
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-firefox-report.html`,

              `/codebuild/output/${props.portal.toLocaleLowerCase()}-safari-summary.txt`,
              `/codebuild/output/${props.portal.toLocaleLowerCase()}-safari-report.html`,
            ],
            'base-directory': '/codebuild/output',
          },
        }),
      },
    );
  }
}
