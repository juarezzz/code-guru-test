/* -------------- External -------------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* -------------- Constructs -------------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* -------------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
  cognito_construct: CognitoConstruct;
}

export class AdminMRFUsersDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Admin-MRFUsers-DELETE-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        timeout: Duration.seconds(30),
        functionName: `admin-mrf-users-delete-${props.environment.toLowerCase()}`,
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
          COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
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
