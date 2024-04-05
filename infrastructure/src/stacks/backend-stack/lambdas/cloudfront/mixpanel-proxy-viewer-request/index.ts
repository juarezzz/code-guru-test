/* ---------- External ---------- */
import path from 'path';
import fs from 'fs';
import { Construct } from 'constructs';
import { experimental } from 'aws-cdk-lib/aws-cloudfront';
import { Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class MixpanelProxyViewerRequestLambda extends Construct {
  public readonly function: experimental.EdgeFunction;

  public readonly code: string;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.code = fs.readFileSync(path.join(__dirname, 'handler.js'), 'utf-8');

    this.function = new experimental.EdgeFunction(
      scope,
      `MixpanelProxyViewerRequest-LambdaEdge-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        code: Code.fromInline(this.code),
        handler: 'index.handler',
        functionName: `mixpanel-proxy-view-request-${props.environment.toLowerCase()}`,
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
      },
    );
  }
}
