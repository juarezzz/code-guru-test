/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { WebRCPortalStack } from '_stacks/web-rc-portal-stack';

/* ---------- Functions ---------- */
const build_and_deploy_web_rc_portal_stack = ({
  app,
  environment,
}: Build.BuildAndDeployPolytagStackDTO) => {
  return new WebRCPortalStack(app, `${environment}-Web-RC-Portal`, {
    stackName: `${environment}-Web-RC-Portal`,
    env: {
      region: 'us-east-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    environment,
  });
};

export { build_and_deploy_web_rc_portal_stack };
