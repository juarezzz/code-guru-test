/* ---------- External ---------- */
import path from 'path';
import fs from 'fs';
import { Construct } from 'constructs';
import { experimental } from 'aws-cdk-lib/aws-cloudfront';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class AnalyticsWEBOriginRequestLambda extends Construct {
  public readonly function: experimental.EdgeFunction;

  public readonly code: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.code = fs.readFileSync(path.join(__dirname, 'handler.js'), 'utf-8');

    this.code = this.code.replace(
      'STREAM_NAME',
      `Analytics-DataStream-${props.environment}`,
    );

    this.function = new experimental.EdgeFunction(
      scope,
      `EdgeFunction-${props.environment}`,
      {
        runtime: Runtime.NODEJS_16_X,
        handler: 'index.handler',
        code: Code.fromInline(this.code),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['kinesis:*'],
        resources: ['*'],
      }),
    );
  }
}
