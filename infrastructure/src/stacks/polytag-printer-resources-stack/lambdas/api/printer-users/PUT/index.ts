/* ---------- External ---------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  dynamodb_construct: DynamoDBConstruct;
}

export class PrinterUsersPUTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Printer-Users-PUT-Function-${props.environment}`,
      {
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        description: 'Changes user password',
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
        },
        functionName: `printer-users-put-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:*', 'dynamodb:*'],
            resources: ['*'],
          }),
        ],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 128,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );
  }
}
