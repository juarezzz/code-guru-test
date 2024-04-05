/* ---------- External ---------- */
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';

/* ---------- Types ---------- */
import { Layers } from '_stacks/diagnostics-stack/constructs/Layers/@types';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class LayersConstruct extends Construct {
  public readonly layers: Layers;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.layers = {
      aws_lambda: new LayerVersion(
        scope,
        `aws-lambda-layer-${props.environment.toLocaleLowerCase()}-diagnostics`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X],
          code: Code.fromAsset(
            path.resolve(__dirname, '..', '..', '..', 'layers', 'aws-lambda'),
          ),
          description: 'Layer for aws-lambda module.',
        },
      ),
      playwright_lambda: new LayerVersion(
        scope,
        `playwright-lambda-layer-${props.environment.toLocaleLowerCase()}-diagnostics`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X],
          code: Code.fromAsset(
            path.resolve(
              __dirname,
              '..',
              '..',
              '..',
              'layers',
              'playwright-lambda',
            ),
          ),
          description:
            'Runtime and Chromium instance for running Playwright in a lambda.',
        },
      ),
    };
  }
}
