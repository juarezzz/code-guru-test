/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { CertificateStack } from '_certificate-stack';

/* ---------- Functions ---------- */
const buildAndDeployCertificateStack = ({
  app,
  environment,
  children_stack,
}: Build.BuildAndDeployCertificateStackDTO) => {
  const certificate_stack = new CertificateStack(
    app,
    `${environment}-Certificate-${children_stack}`,
    {
      environment,
      children_stack_name: children_stack || '',
      stackName: `${environment}-Certificate-${children_stack}`,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      },
    },
  );

  return certificate_stack;
};

export { buildAndDeployCertificateStack };
