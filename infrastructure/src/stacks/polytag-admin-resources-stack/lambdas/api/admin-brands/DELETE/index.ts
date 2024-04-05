/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cors_allowed_origin: string;
  cognito_construct: CognitoConstruct;
  environment: string;
}

export class AdminBrandsDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, bucket_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Admin-Brands-DELETE-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
          BUCKET_NAME: bucket_name,
          COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.brand.userpool_client
              .userPoolClientId,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.brand.userpool.userPoolId,
        },
        functionName: `admin-brands-delete-${props.environment}`,
        handler: 'handler',
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(180),
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
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
