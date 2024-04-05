/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
}

export class AdminAuthenticationGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Admin-Authentication-GET-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.join(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-authentication-get-${props.environment.toLowerCase()}`,
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.admin.userpool_client
              .userPoolClientId,
        },
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda', 'base-64'],
        },
        layers: [
          props.layers_construct.layers.aws_lambda,
          props.layers_construct.layers.base_64,
        ],
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
