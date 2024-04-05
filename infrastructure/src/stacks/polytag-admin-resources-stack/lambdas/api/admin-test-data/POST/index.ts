/* -------------- External -------------- */
import { resolve } from 'path';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/* -------------- Constructs -------------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* -------------- Interfaces -------------- */
interface Props {
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
}

export class AdminTestDataPOSTLambda extends Construct {
  readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `AdminTestData-POST-Function-${props.environment}`,
      {
        functionName: `admin-test-data-post-${props.environment.toLowerCase()}`,
        entry: resolve(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          BRAND_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
          BRAND_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.brand.userpool_client
              .userPoolClientId,
          ADMIN_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.admin.userpool.userPoolId,
          ADMIN_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.admin.userpool_client
              .userPoolClientId,
          PRINTER_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.printer.userpool.userPoolId,
          PRINTER_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.printer.userpool_client
              .userPoolClientId,
          THIRD_PARTY_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
          THIRD_PARTY_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.third_party.userpool_client
              .userPoolClientId,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(60),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 'cognito-idp:*'],
        resources: ['*'],
      }),
    );
  }
}
