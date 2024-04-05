/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Artifact } from 'aws-cdk-lib/aws-codepipeline';

/* ---------- Constructs ---------- */
import { BuildAction } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Build/Test';

/* ---------- Helpers ---------- */
import { Portals } from '_helpers/pipeline/get-parsed-envs';

interface Props {
  environment: string;
  folder: string;
  portal: string;
  domain_name: string;
  teardown_handler_url: string;
}

export class WebPortalStage extends Construct {
  public readonly action: BuildAction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.action = new BuildAction(
      this,
      `Pipeline-Browser${props.portal}ActionConstruct-${props.environment}`,
      {
        environment: props.environment,
        folder: props.folder as Portals,
        portal: props.portal,
        domain_name: props.domain_name,
        teardown_handler_url: props.teardown_handler_url,
      },
    );
  }
}
