/* ---------- External ---------- */
import { Duration } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import path from 'path';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  environment: string;
}

export class MrfInvitationPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, rc_portal_redirect_url }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      this,
      `Mrf-Invitation-POST-Function-${props.environment}`,
      {
        functionName: `mrf-invitation-post-${props.environment.toLowerCase()}`,
        architecture: Architecture.ARM_64,
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          ENVIRONMENT: props.environment,
          REDIRECT_URL: rc_portal_redirect_url,
          TABLE_NAME: table_name,
        },
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'ses:*'],
            resources: ['*'],
          }),
        ],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 4096,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );
  }
}
