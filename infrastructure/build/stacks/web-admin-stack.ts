/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { WebAdminStack } from '_stacks/web-admin-stack';

/* ---------- Functions ---------- */
const buildAndDeployWebAdminStack = ({
  app,
  environment,
}: // certificate_stack,
Build.BuildAndDeployPolytagStackDTO) => {
  return new WebAdminStack(app, `${environment}-Web-Admin-MAIN`, {
    stackName: `${environment}-Admin-Web`,
    env: {
      region: 'us-east-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    environment,
    // certificate_stack,
  });
};

export { buildAndDeployWebAdminStack };
