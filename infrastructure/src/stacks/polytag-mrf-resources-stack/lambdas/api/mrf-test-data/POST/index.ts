/* ---------- External ---------- */
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { join } from 'path';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  cors_allowed_origin: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  environment: string;
}

export class MrfTestDataPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { timestream_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Mrf-TestData-POST-Function-${props.environment}`,
      {
        functionName: `mrf-test-data-post-${props.environment.toLowerCase()}`,
        entry: join(__dirname, 'handler.ts'),
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: [
              'dynamodb:*',
              'cognito-idp:*',
              'cognito-identity:*',
              'timestream:*',
            ],
            resources: ['*'],
          }),
        ],
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.mrf.userpool_client
              .userPoolClientId,
          TIMESTREAM_NAME: timestream_name,
        },
        bundling: { externalModules: ['@aws-sdk/*'] },
        logRetention: RetentionDays.ONE_WEEK,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        timeout: Duration.seconds(60),
        runtime: Runtime.NODEJS_18_X,
      },
    );
  }
}
