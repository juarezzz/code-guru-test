/* ---------- External ---------- */
import { Construct } from 'constructs';
import { CodeBuildActionProps } from 'aws-cdk-lib/aws-codepipeline-actions';

/* ---------- Constructs ---------- */
import { WebPortalStage } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Stages/WebPortalStage';
import { ArtifactsConstruct } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser/Artifacts';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  environment: string;
  artifacts: ArtifactsConstruct;
}

interface Portals {
  brand: WebPortalStage;
  admin: WebPortalStage;
  printer: WebPortalStage;
}

export class BrowserEnvironmentStage extends Construct {
  public readonly tests: Portals;

  public readonly actions: CodeBuildActionProps[];

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const {
      domain_name,
      admin_domain_name,
      printer_domain_name,
      web_teardown_handler,
      web_admin_teardown_handler,
      web_printer_portal_teardown_handler,
    }: CDK.Context = this.node.tryGetContext(props.environment);

    this.tests = {
      brand: new WebPortalStage(
        this,
        `CrossBrowser-Brand-${props.environment}`,
        {
          environment: props.environment,
          portal: 'Brand',
          folder: 'web',
          domain_name,
          teardown_handler_url: web_teardown_handler,
        },
      ),

      admin: new WebPortalStage(
        this,
        `CrossBrowser-Admin-${props.environment}`,
        {
          environment: props.environment,
          portal: 'Admin',
          folder: 'web-admin',
          domain_name: admin_domain_name,
          teardown_handler_url: web_admin_teardown_handler,
        },
      ),

      printer: new WebPortalStage(
        this,
        `CrossBrowser-Printer-${props.environment}`,
        {
          environment: props.environment,
          portal: 'Printer',
          folder: 'web-printer-portal',
          domain_name: printer_domain_name,
          teardown_handler_url: web_printer_portal_teardown_handler,
        },
      ),
    };

    this.actions = [
      {
        actionName: 'Brand-Portal',
        project: this.tests.brand.action.build,
        input: props.artifacts.brand.input,
        outputs: [props.artifacts.brand.output],
        runOrder: 1,
      },

      {
        actionName: 'Admin-Portal',
        project: this.tests.admin.action.build,
        input: props.artifacts.admin.input,
        outputs: [props.artifacts.admin.output],
        runOrder: 2,
      },

      {
        actionName: 'Printer-Portal',
        project: this.tests.printer.action.build,
        input: props.artifacts.printer.input,
        outputs: [props.artifacts.printer.output],
        runOrder: 3,
      },
    ];
  }
}
