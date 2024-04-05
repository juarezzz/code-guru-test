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
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  cors_allowed_origin: string;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers_construct: LayersConstruct;
}

export class AdminThirdPartyUsersPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { third_party_redirect_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `AdminThirdParty-Users-POST-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          THIRD_PARTY_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
          REDIRECT_URL: third_party_redirect_url,
        },
        functionName: `admin-third-party-users-post-${props.environment.toLowerCase()}`,
        handler: 'handler',
        layers: [props.layers_construct.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 'ses:*', 'cognito-idp:*'],
        resources: ['*'],
      }),
    );
  }
}
