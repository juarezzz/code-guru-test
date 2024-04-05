/* ---------- JSONs ---------- */
import { context } from '__cdk.json';

/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { PolytagPipelineStack } from '_pipeline-stack';

/* ---------- Functions ---------- */
const buildAndDeployPipelineStack = async ({
  app,
  environment,
}: Build.BuildAndDeployStackDTO) => {
  new PolytagPipelineStack(app, `${environment}-Pipeline-MAIN`, {
    environment,
    stack_name: `${environment}-Pipeline`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: context[environment].region,
    },
  });
};

export { buildAndDeployPipelineStack };
