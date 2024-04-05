/* -------------- External -------------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* -------------- Constructs -------------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* -------------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  buckets_construct: BucketsConstruct;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
}

export class TestDataDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { timestream_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `TestData-DELETE-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          BUCKET_NAME: props.buckets_construct.buckets.main_bucket.bucketName,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.brand.userpool_client
              .userPoolClientId,
          MRF_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
          TIMESTREAM_NAME: timestream_name,
          BRAND_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `test-data-delete-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_16_X,
        timeout: Duration.seconds(30),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:*',
          'cognito-idp:*',
          'cognito-identity:*',
          's3:*',
          'timestream:*',
        ],
        resources: ['*'],
      }),
    );
  }
}
