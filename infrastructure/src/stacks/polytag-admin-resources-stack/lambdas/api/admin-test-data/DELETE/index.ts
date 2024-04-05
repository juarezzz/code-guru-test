/* -------------- External -------------- */
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { resolve } from 'path';

/* -------------- Constructs -------------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

interface Props {
  buckets_construct: BucketsConstruct;
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
}

export class AdminTestDataDELETELambda extends Construct {
  readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `AdminTestData-DELETE-Function-${props.environment}`,
      {
        functionName: `admin-test-data-delete-${props.environment.toLowerCase()}`,
        entry: resolve(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          BRAND_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
          ADMIN_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.admin.userpool.userPoolId,
          THIRD_PARTY_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
          PRINTER_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.printer.userpool.userPoolId,
          BUCKET_NAME: props.buckets_construct.buckets.main_bucket.bucketName,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(60),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 'cognito-idp:*', 's3:*'],
        resources: ['*'],
      }),
    );
  }
}
