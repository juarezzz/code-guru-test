/* -------------- External -------------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* -------------- Constructs -------------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* -------------- Interfaces -------------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
}

export class AdminClientsCheckAndSaveLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly case: LambdaInvoke;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.function = new NodejsFunction(
      scope,
      `Admin-Clients-Check-And-Save-Step-Lambda-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `admin-clients-check-and-save-step-${props.environment.toLowerCase()}`,
        handler: 'handler',
        timeout: Duration.seconds(30),
        environment: {
          TABLE_NAME: props.dynamodb_construct.tables.main_table.tableName,
        },
      },
    );

    this.case = new LambdaInvoke(
      scope,
      `Admin-Clients-Check-And-Save-Step-Case-${props.environment}`,
      {
        lambdaFunction: this.function,
        outputPath: '$',
        inputPath: '$.Payload.client',
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Step');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
