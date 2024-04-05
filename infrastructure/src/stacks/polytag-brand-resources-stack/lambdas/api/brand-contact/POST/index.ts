/* ----------- External ----------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ----------- Interfaces ----------- */
interface Props {
  layers: Layers;
  environment: string;
}

export class BrandContactPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Brand-Contact-POST-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          SLACK_WEBHOOK_URL:
            'https://hooks.slack.com/services/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',
          ENVIRONMENT: props.environment,
        },
        functionName: `brand-contact-post-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['ses:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );
  }
}
