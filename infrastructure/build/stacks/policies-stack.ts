/* ---------- External ---------- */
import { App } from 'aws-cdk-lib';

/* ---------- Stacks ---------- */
import { PolytagWebPoliciesStack } from '_web-policies-stack';

/* ---------- Functions ---------- */
const buildAndDeployPoliciesStack = async (app: App) => {
  new PolytagWebPoliciesStack(app, 'BYBTL-Web-Policies');
};

export { buildAndDeployPoliciesStack };
