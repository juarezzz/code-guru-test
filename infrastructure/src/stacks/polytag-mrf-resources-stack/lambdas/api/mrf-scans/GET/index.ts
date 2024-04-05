/* ---------- External ---------- */
import path from 'path';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces -------------- */
interface Props {
  environment: string;
  layers_construct: LayersConstruct;
}

export class MrfScansGETLambda extends Construct {
  public readonly function: NodejsFunction;

  public readonly rule: Rule;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name, timestream_name }: CDK.Context =
      this.node.tryGetContext(props.environment);

    this.function = new NodejsFunction(
      this,
      `Mrf-Scans-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*', 'aws-lambda'],
        },
        entry: path.join(__dirname, 'handler.ts'),
        environment: {
          TIMESTREAM_NAME: timestream_name,
          TABLE_NAME: table_name,
        },
        functionName: `mrf-scans-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*', 'timestream:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers_construct.layers.aws_lambda],
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

    this.rule = new Rule(scope, `Mrf-Scans-GET-Rule-${props.environment}`, {
      ruleName: `mrf-scans-get-rule-${props.environment.toLowerCase()}`,
      schedule: Schedule.cron({ minute: '*/2' }),
      targets: [new LambdaFunction(this.function)],
    });
  }
}
