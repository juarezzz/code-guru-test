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
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

interface Props {
  cors_allowed_origin: string;
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  layers_construct: LayersConstruct;
}

export class AdminAuthenticationPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Admin-Authentication-POST-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-authentication-post-${props.environment.toLowerCase()}`,
        entry: path.join(__dirname, 'handler.ts'),
        handler: 'handler',
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
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        layers: [props.layers_construct.layers.aws_lambda],
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
