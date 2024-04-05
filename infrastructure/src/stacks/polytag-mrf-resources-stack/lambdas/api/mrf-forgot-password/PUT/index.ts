/* ----------- External ----------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ----------- Interfaces ----------- */
interface Props {
  environment: string;
  cognito_construct: CognitoConstruct;
}

export class MrfForgotPasswordPUTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `PolytagMrf-ForgotPassword-PUT-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.mrf.userpool_client
              .userPoolClientId,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
        },
        functionName: `polytag-mrf-forgot-password-put-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:*'],
            resources: ['*'],
          }),
        ],
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
