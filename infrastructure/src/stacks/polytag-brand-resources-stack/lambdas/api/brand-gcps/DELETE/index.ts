/* ----------- External ----------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ----------- Interfaces ----------- */
interface Props {
  cors_allowed_origin: string;
  environment: string;
}

export class BrandGCPsDELETELambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `BrandGCPs-DELETE-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        description: 'Deletes an existing GCP from a brand.',
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: table_name,
        },
        functionName: `brand-gcps-delete-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*'],
            resources: ['*'],
          }),
        ],
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(30),
      },
    );
  }
}
