/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces -------------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  queue_url: string;
}

export class ThirdPartyAuthenticationPOSTLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `ThirdParty-Authentication-POST-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: { externalModules: ['@aws-sdk/*', 'aws-lambda'] },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          THIRD_PARTY_COGNITO_CLIENT_ID:
            props.cognito_construct.userpools.third_party.userpool_client
              .userPoolClientId,
          THIRD_PARTY_COGNITO_USERPOOL_ID:
            props.cognito_construct.userpools.third_party.userpool.userPoolId,
          TABLE_NAME: table_name,
          QUEUE_URL: props.queue_url,
        },
        functionName: `third-party-authentication-post-${props.environment.toLowerCase()}`,
        handler: 'handler',
        layers: [props.layers_construct.layers.aws_lambda],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        memorySize: 1024,
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
        initialPolicy: [
          new PolicyStatement({
            actions: ['cognito-idp:*', 'dynamodb:*', 'sqs:*'],
            resources: ['*'],
          }),
        ],
      },
    );
  }
}
