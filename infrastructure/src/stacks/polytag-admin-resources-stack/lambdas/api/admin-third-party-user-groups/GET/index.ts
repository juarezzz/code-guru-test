/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
  layers_construct: LayersConstruct;
  cognito_construct: CognitoConstruct;
}

export class AdminThirdPartyUserGroupsGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `AdminThirdPartyUserGroups-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        runtime: Runtime.NODEJS_18_X,
        entry: path.join(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-third-party-user-groups-get-${props.environment.toLowerCase()}`,
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
        },
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        layers: [props.layers_construct.layers.aws_lambda],
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:*'],
            resources: ['*'],
          }),
        ],
        timeout: Duration.seconds(30),
      },
    );
  }
}
