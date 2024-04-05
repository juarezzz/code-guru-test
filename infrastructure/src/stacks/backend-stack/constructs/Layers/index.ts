/* ---------- External ---------- */
import { Code, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import path from 'path';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class LayersConstruct extends Construct {
  public readonly layers: Layers;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.layers = {
      '@aws-crypto/client-node': new LayerVersion(
        scope,
        `aws-crypto-client-node-layer-${props.environment.toLocaleLowerCase()}`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X],
          code: Code.fromAsset(
            path.resolve(
              __dirname,
              '..',
              '..',
              '..',
              'layers',
              '@aws-crypto',
              'client-node',
            ),
          ),
          description: 'Layer for @aws-crypto/client-node.',
        },
      ),

      aws_jwt_verify: new LayerVersion(
        scope,
        `aws-jwt-verify-layer-${props.environment.toLocaleLowerCase()}`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X],
          code: Code.fromAsset(
            path.resolve(
              __dirname,
              '..',
              '..',
              '..',
              'layers',
              'aws-jwt-verify',
            ),
          ),
          description: 'Layer for aws-jwt-verify module.',
        },
      ),
      aws_lambda: new LayerVersion(
        scope,
        `aws-lambda-layer-${props.environment.toLocaleLowerCase()}`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X, Runtime.NODEJS_14_X],
          code: Code.fromAsset(
            path.resolve(__dirname, '..', '..', '..', 'layers', 'aws-lambda'),
          ),
          description: 'Layer for aws-lambda module.',
        },
      ),
      base_64: new LayerVersion(
        scope,
        `base-64-layer-${props.environment.toLocaleLowerCase()}`,
        {
          compatibleRuntimes: [Runtime.NODEJS_18_X],
          code: Code.fromAsset(
            path.resolve(__dirname, '..', '..', '..', 'layers', 'base-64'),
          ),
          description: 'Layer for base-64 module.',
        },
      ),
    };
  }
}
