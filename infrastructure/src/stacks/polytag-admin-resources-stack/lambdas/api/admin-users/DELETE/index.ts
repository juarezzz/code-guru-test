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

interface Props {
  cors_allowed_origin: string;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers_construct: LayersConstruct;
}

export class AdminUsersDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Admin-Users-DELETE-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.admin.userpool_client
              .userPoolClientId,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.admin.userpool.userPoolId,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
        },
        functionName: `admin-users-delete-${props.environment.toLowerCase()}`,
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
        actions: ['cognito-idp:*', 'dynamodb:*'],
        resources: ['*'],
      }),
    );
  }
}
