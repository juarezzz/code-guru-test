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

interface Props {
  cors_allowed_origin: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  environment: string;
}

export class PrinterTestDataPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Printer-TestData-POST-Function-${props.environment}`,
      {
        functionName: `printer-test-data-post-${props.environment.toLowerCase()}`,
        entry: join(__dirname, 'handler.ts'),
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'cognito-idp:*', 'cognito-identity:*'],
            resources: ['*'],
          }),
        ],
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          PRINTER_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.printer.userpool.userPoolId,
          PRINTER_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.printer.userpool_client
              .userPoolClientId,
        },
        bundling: { externalModules: ['@aws-sdk/*'] },
        logRetention: RetentionDays.ONE_WEEK,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
      },
    );
  }
}
