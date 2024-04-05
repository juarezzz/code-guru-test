/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { WebStack } from '_stacks/web-stack';

/* ---------- Functions ---------- */
const build_and_deploy_web_stack = ({
  app,
  profile,
  environment,
}: Build.BuildAndDeployWebStackDTO) => {
  return new WebStack(app, `${environment}-Web`, {
    stackName: `${environment}-Web`,
    env: {
      region: 'us-east-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    profile,
    environment,
  });
};

export { build_and_deploy_web_stack };
