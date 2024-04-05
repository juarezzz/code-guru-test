/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import {
  Function as CloudfrontFunction,
  FunctionCode,
} from 'aws-cdk-lib/aws-cloudfront';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class CloudfrontResolverViewerRequestLambda extends Construct {
  public readonly function: CloudfrontFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new CloudfrontFunction(
      scope,
      `CloudfrontResolverViewerRequest-Lambda-${props.environment}`,
      {
        code: FunctionCode.fromFile({
          filePath: path.resolve(__dirname, 'handler.js'),
        }),
      },
    );
  }
}
