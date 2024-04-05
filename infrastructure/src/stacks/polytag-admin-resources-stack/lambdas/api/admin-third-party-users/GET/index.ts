/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Duration } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Interfaces -------------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
  layers_construct: LayersConstruct;
}

export class AdminThirdPartyUsersGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `AdminThirdPartyUsers-GET-Function-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.join(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-third-party-users-get-${props.environment.toLowerCase()}`,
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
        },
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        layers: [props.layers_construct.layers.aws_lambda],
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*'],
        resources: ['*'],
      }),
    );
  }
}
