import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

export interface Layers {
  '@aws-crypto/client-node': LayerVersion;
  aws_jwt_verify: LayerVersion;
  aws_lambda: LayerVersion;
  base_64: LayerVersion;
}
