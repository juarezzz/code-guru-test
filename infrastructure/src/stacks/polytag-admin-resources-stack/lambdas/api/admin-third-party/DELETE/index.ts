/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  environment: string;
  layers_construct: LayersConstruct;
  cognito_construct: CognitoConstruct;
}

export class AdminThirdPartyDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `AdminThirdParty-DELETE-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: table_name,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
        },
        functionName: `admin-third-party-delete-${props.environment.toLowerCase()}`,
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
