/* ---------- External ---------- */
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { S3Buckets } from '_pipeline-stack/constructs/S3Buckets';

/* ---------- Environments ---------- */
import { FrontendTestPipeline } from '_pipeline-stack/constructs/Pipelines/tests/Frontend';
import { CrossBrowserTestPipeline } from '_pipeline-stack/constructs/Pipelines/tests/CrossBrowser';
import { BackendDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/Backend';
import { FrontendDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/Frontend';
import { RCFrontendDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/RCFrontend';
import { AdminFrontendDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/AdminFrontend';
import { PrinterFrontendDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/PrinterFrontend';
import { DiagnosticsDeployPipeline } from '_pipeline-stack/constructs/Pipelines/environments/Diagnostics';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  s3_buckets: S3Buckets;
}

export class Pipelines extends Construct {
  public readonly backend_deploy_pipeline: BackendDeployPipeline;

  public readonly diagnostics_deploy_pipeline: DiagnosticsDeployPipeline;

  public readonly frontend_deploy_pipeline: FrontendDeployPipeline;

  public readonly admin_frontend_deploy_pipeline: AdminFrontendDeployPipeline;

  public readonly rc_frontend_deploy_pipeline: RCFrontendDeployPipeline;

  public readonly printer_frontend_deploy_pipeline: PrinterFrontendDeployPipeline;

  public readonly frontend_test_pipeline: FrontendTestPipeline;

  public readonly cross_browser_test_pipeline: CrossBrowserTestPipeline;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.backend_deploy_pipeline = new BackendDeployPipeline(
      scope,
      `BackendDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.diagnostics_deploy_pipeline = new DiagnosticsDeployPipeline(
      scope,
      `DiagnosticsDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.frontend_deploy_pipeline = new FrontendDeployPipeline(
      scope,
      `FrontendDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.admin_frontend_deploy_pipeline = new AdminFrontendDeployPipeline(
      scope,
      `AdminFrontendDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.rc_frontend_deploy_pipeline = new RCFrontendDeployPipeline(
      scope,
      `RCFrontendDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.printer_frontend_deploy_pipeline = new PrinterFrontendDeployPipeline(
      scope,
      `PrinterFrontendDeployPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.frontend_test_pipeline = new FrontendTestPipeline(
      scope,
      `FrontendTestPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );

    this.cross_browser_test_pipeline = new CrossBrowserTestPipeline(
      scope,
      `CrossBrowserTestPipeline-${props.environment}`,
      {
        environment: props.environment,
        s3_buckets: props.s3_buckets,
      },
    );
  }
}
