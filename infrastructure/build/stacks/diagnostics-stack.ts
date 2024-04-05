/* ---------- JSONs ---------- */
import { context } from '__cdk.json';

/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { DiagnosticsStack } from '_stacks/diagnostics-stack';

/* ---------- Functions ---------- */
const build_and_deploy_diagnostics_stack = ({
  app,
  environment,
}: Build.BuildAndDeployPolytagStackDTO) => {
  new DiagnosticsStack(app, `${environment}-Diagnostics`, {
    environment,
    stackName: `${environment}-Diagnostics`,
    description: `Diagnostics stack holding scheduled events for services health checks, and API performance analysis. ${environment}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: context[environment].region,
    },
  });
};

export { build_and_deploy_diagnostics_stack };
