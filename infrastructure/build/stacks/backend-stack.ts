/* ---------- JSONs ---------- */
import { context } from '__cdk.json';

/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Functions ---------- */
const build_and_deploy_backend_stack = ({
  app,
  environment,
}: // certificate_stack,
Build.BuildAndDeployPolytagStackDTO) => {
  new BackendStack(app, `${environment}-Backend`, {
    environment,
    stackName: `${environment}-Backend`,
    description: `Backend stack holding all main functionalities of the application.
      This stack is responsible for the main business logic of the application. ${environment}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: context[environment].region,
    },
  });
};

export { build_and_deploy_backend_stack };
