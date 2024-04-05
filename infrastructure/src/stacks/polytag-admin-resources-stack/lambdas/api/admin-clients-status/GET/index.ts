/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { StateMachineConstruct } from '_stacks/backend-stack/constructs/StateMachine';

/* ---------- Interfaces ---------- */
interface Props {
  cors_allowed_origin: string;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  state_machine_construct: StateMachineConstruct;
}

export class AdminClientsStatusGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      this,
      `Admin-Clients-Status-GET-Function-${props.environment}`,
      {
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          CORS_ALLOWED_ORIGIN: props.cors_allowed_origin,
          ENVIRONMENT: props.environment,
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
          STATEMACHINE_ARN:
            props.state_machine_construct.state_machines.admin_clients
              .state_machine.stateMachineArn,
        },
        functionName: `admin-clients-status-get-${props.environment}`,
        handler: 'handler',
        runtime: Runtime.NODEJS_18_X,
        timeout: Duration.seconds(60),
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
        actions: ['dynamodb:*', 'states:StartExecution'],
        resources: ['*'],
      }),
    );
  }
}
