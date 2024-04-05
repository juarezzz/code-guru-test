/* -------------- External -------------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* -------------- Constructs -------------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

interface Props {
  cors_allowed_origin: string;
  environment: string;
  cognito_construct: CognitoConstruct;
}

export class AdminMRFUsersPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, rc_portal_redirect_url }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      this,
      `Admin-MRFUsers-POST-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-mrf-users-post-${props.environment.toLowerCase()}`,
        entry: path.join(__dirname, 'handler.ts'),
        handler: 'handler',
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
          REDIRECT_URL: rc_portal_redirect_url,
          MRF_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.mrf.userpool.userPoolId,
        },
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['cognito-idp:*', 'dynamodb:*', 'ses:*'],
        resources: ['*'],
      }),
    );
  }
}
