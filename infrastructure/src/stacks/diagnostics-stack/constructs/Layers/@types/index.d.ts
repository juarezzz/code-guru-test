import { LayerVersion } from 'aws-cdk-lib/aws-lambda';

export interface Layers {
  aws_lambda: LayerVersion;
  playwright_lambda: LayerVersion;
}
