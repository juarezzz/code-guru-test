/* ---------- External ---------- */
import path from 'path';
import { config } from 'dotenv';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cors_allowed_origin: string;
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  environment: string;
}

config();

export class AdminBrandsPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { redirect_url }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Admin-Brands-POST-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          REDIRECT_URL: redirect_url,
          BRAND_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
        },
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-brands-post-${props.environment.toLowerCase()}`,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
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
