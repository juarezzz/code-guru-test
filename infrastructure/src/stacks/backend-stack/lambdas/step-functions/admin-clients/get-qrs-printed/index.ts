/* ---------- External ---------- */
import path from 'path';
import { Duration, Tags } from 'aws-cdk-lib';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Construct } from 'constructs';
import { LambdaInvoke } from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
}

export class GetQRsPrintedLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly case: LambdaInvoke;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, timestream_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      scope,
      `Get-QRs-Printed-Step-Lambda-${props.environment}`,
      {
        runtime: Runtime.NODEJS_18_X,
        entry: path.resolve(__dirname, 'handler.ts'),
        logRetention: RetentionDays.TWO_WEEKS,
        logRetentionRetryOptions: {
          base: Duration.seconds(10),
          maxRetries: 15,
        },
        functionName: `get-qrs-printed-step-${props.environment.toLowerCase()}`,
        handler: 'handler',
        timeout: Duration.seconds(30),
        environment: {
          TABLE_NAME: table_name,
          TIMESTREAM_NAME: timestream_name,
        },
        memorySize: 256,
      },
    );

    this.case = new LambdaInvoke(
      scope,
      `Get-QRs-Printed-Step-Case-${props.environment}`,
      {
        lambdaFunction: this.function,
        outputPath: '$',
        inputPath: '$.Payload.client',
      },
    );

    this.function.addToRolePolicy(
      new PolicyStatement({
        actions: ['dynamodb:*', 'timestream:*'],
        resources: ['*'],
      }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.function).add('Custom:Service', 'Lambda');
    Tags.of(this.function).add('Custom:Event', 'Step');
    Tags.of(this.function).add('Custom:Environment', props.environment);
  }
}
