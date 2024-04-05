/* ---------- External ---------- */
import path from 'path';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { v4 as uuidv4 } from 'uuid';

/* -------------- Types -------------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  rest_api_id: string;
}

export class ApiDeploymentTriggerLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `ApiDeployment-Trigger-Function--${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        handler: 'handler',
        logRetention: RetentionDays.ONE_DAY,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `api-deployment-trigger-${props.environment.toLowerCase()}`,
        timeout: Duration.seconds(120),
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          ENVIRONMENT: props.environment,
          REST_API_ID: props.rest_api_id,
          RANDOM_VALUE: uuidv4(), // Trigger new execution each deployment
        },
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['execute-api:*', 'apigateway:*'],
        resources: ['*'],
      }),
    );
  }
}
