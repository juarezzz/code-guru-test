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
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* -------------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  sqs_construct: SQSConstruct;
  environment: string;
}

export class TestDataPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { api_domain_name, timestream_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      this,
      `TestData-POST-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          LABELS_TABLE_NAME:
            props.dynamodb_construct.tables.labels_table.tableName,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.brand.userpool_client
              .userPoolClientId,
          MRF_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
          MRF_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.mrf.userpool_client
              .userPoolClientId,
          QUEUE_URL: props.sqs_construct.queues.printer_queue.queueUrl,
          API_DOMAIN_NAME: api_domain_name,
          TIMESTREAM_NAME: timestream_name,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `test-data-post-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_16_X,
        timeout: Duration.seconds(30),
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'dynamodb:*',
          'timestream:*',
          'sqs:*',
          'cognito-idp:*',
          'cognito-identity:*',
        ],
        resources: ['*'],
      }),
    );
  }
}
