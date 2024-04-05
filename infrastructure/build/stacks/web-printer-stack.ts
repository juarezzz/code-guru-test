/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Stacks ---------- */
import { WebPrinterStack } from '_stacks/web-printer-stack';

/* ---------- Functions ---------- */
const build_and_deploy_web_printer_stack = ({
  app,
  environment,
}: Build.BuildAndDeployPolytagStackDTO) => {
  return new WebPrinterStack(app, `${environment}-Web-Printer`, {
    stackName: `${environment}-Web-Printer`,
    env: {
      region: 'us-east-1',
      account: process.env.CDK_DEFAULT_ACCOUNT,
    },
    environment,
  });
};

export { build_and_deploy_web_printer_stack };
