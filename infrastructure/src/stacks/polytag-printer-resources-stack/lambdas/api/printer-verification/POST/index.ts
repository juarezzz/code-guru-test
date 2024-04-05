/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
}

export class PrinterVerificationPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Printer-Verification-POST-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.printer.userpool_client
              .userPoolClientId,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.printer.userpool.userPoolId,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `printer-verification-post-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:*'],
            resources: ['*'],
          }),
        ],
      },
    );
  }
}
