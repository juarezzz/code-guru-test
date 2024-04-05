/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Interfaces ---------- */
interface Props {
  kms_key_arn: string;
  environment: string;
  layers_construct: LayersConstruct;
}

export class CognitoEmailTriggerLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `CognitoEmail-Function-Trigger-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          KMS_KEY_ARN: props.kms_key_arn,
          ENVIRONMENT: props.environment,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `cognito-email-trigger-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(120),
        bundling: {
          externalModules: ['@aws-sdk/*', '@aws-crypto/client-node'],
        },
        layers: [props.layers_construct.layers['@aws-crypto/client-node']],
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['kms:*', 'cognito-idp:*', 'ses:*'],
        resources: ['*'],
      }),
    );
  }
}
