/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  cors_allowed_origin: string;
}

export class AdminThirdPartyUsersDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `AdminThirdParty-Users-DELETE-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: table_name,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.third_party.userpool_client
              .userPoolClientId,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
        },
        functionName: `admin-third-party-users-delete-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'cognito-idp:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers_construct.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
      },
    );
  }
}
