/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
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

export class MrfVerificationGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Mrf-Verification-GET-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.mrf.userpool_client
              .userPoolClientId,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `mrf-verification-get-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['cognito-idp:*'],
        resources: ['*'],
      }),
    );
  }
}
