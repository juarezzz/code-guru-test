/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime, Architecture } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Interfaces ---------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
  cognito_construct: CognitoConstruct;
}

export class AdminForgotPasswordGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `PolytagAdmin-ForgotPassword-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.admin.userpool_client
              .userPoolClientId,
        },
        functionName: `polytag-admin-password-get-${props.environment.toLowerCase()}`,
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
