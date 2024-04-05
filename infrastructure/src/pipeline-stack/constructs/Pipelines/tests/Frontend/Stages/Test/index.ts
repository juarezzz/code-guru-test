/* ---------- External ---------- */
import { Construct } from 'constructs';
import { CodeBuildActionProps } from 'aws-cdk-lib/aws-codepipeline-actions';

/* ---------- Construct ---------- */
import { TestAction } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Build/Test';
import { ArtifactsConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Artifacts';
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';
import { VariablesConstruct } from '_pipeline-stack/constructs/Pipelines/tests/Frontend/Variables';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  environment: string;
  artifacts: ArtifactsConstruct;
  s3_buckets: S3Buckets;
  variables: VariablesConstruct;
}

interface Portals {
  brand_portal_stage: TestAction;
  admin_portal_stage: TestAction;
  rc_portal_stage: TestAction;
  printer_portal_stage: TestAction;
}

export class TestStageConstruct extends Construct {
  public readonly tests: Portals;

  public readonly actions: CodeBuildActionProps[];

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const {
      web_teardown_handler,
      web_admin_teardown_handler,
      web_printer_portal_teardown_handler,
      web_rc_portal_teardown_handler,
    }: CDK.Context = this.node.tryGetContext(props.environment);

    this.tests = {
      brand_portal_stage: new TestAction(
        this,
        `Pipeline-BrandActionConstruct-${props.environment}`,
        {
          environment: props.environment,
          folder: 'web',
          portal: 'Brand',
          teardown_handler_url: web_teardown_handler,
          stack: 'frontend',
          source_bucket: props.s3_buckets.logs_bucket.bucketName,
        },
      ),

      admin_portal_stage: new TestAction(
        this,
        `Pipeline-AdminActionConstruct-${props.environment}`,
        {
          environment: props.environment,
          folder: 'web-admin',
          portal: 'Admin',
          teardown_handler_url: web_admin_teardown_handler,
          stack: 'admin_web',
          source_bucket: props.s3_buckets.logs_bucket.bucketName,
        },
      ),

      rc_portal_stage: new TestAction(
        this,
        `Pipeline-RCActionConstruct-${props.environment}`,
        {
          environment: props.environment,
          folder: 'web-rc-portal',
          portal: 'RC',
          teardown_handler_url: web_rc_portal_teardown_handler,
          stack: 'rc_web',
          source_bucket: props.s3_buckets.logs_bucket.bucketName,
        },
      ),

      printer_portal_stage: new TestAction(
        this,
        `Pipeline-PrinterActionConstruct-${props.environment}`,
        {
          environment: props.environment,
          folder: 'web-printer-portal',
          portal: 'Printer',
          teardown_handler_url: web_printer_portal_teardown_handler,
          stack: 'printer_web',
          source_bucket: props.s3_buckets.logs_bucket.bucketName,
        },
      ),
    };

    this.actions = [
      {
        actionName: 'Brand-Portal',
        project: this.tests.brand_portal_stage.build,
        input: props.artifacts.brand.input,
        outputs: [props.artifacts.brand.output],
        environmentVariables: {
          backend_modified: {
            value: props.variables.backend_modified.reference(),
          },
          stack_modified: {
            value: props.variables.frontend_modified.reference(),
          },
        },
        runOrder: 1,
      },

      {
        actionName: 'Admin-Portal',
        project: this.tests.admin_portal_stage.build,
        input: props.artifacts.admin.input,
        outputs: [props.artifacts.admin.output],
        environmentVariables: {
          backend_modified: {
            value: props.variables.backend_modified.reference(),
          },
          stack_modified: {
            value: props.variables.admin_web_modified.reference(),
          },
        },
        runOrder: 2,
      },

      {
        actionName: 'RC-Portal',
        project: this.tests.rc_portal_stage.build,
        input: props.artifacts.rc.input,
        outputs: [props.artifacts.rc.output],
        environmentVariables: {
          backend_modified: {
            value: props.variables.backend_modified.reference(),
          },
          stack_modified: {
            value: props.variables.rc_web_modified.reference(),
          },
        },
        runOrder: 3,
      },

      {
        actionName: 'Printer-Portal',
        project: this.tests.printer_portal_stage.build,
        input: props.artifacts.printer.input,
        outputs: [props.artifacts.printer.output],
        environmentVariables: {
          backend_modified: {
            value: props.variables.backend_modified.reference(),
          },
          stack_modified: {
            value: props.variables.printer_web_modified.reference(),
          },
        },
        runOrder: 4,
      },
    ];
  }
}
