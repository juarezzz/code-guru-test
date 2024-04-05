/* ----------- External ----------- */
import path from 'path';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ----------- Interfaces ----------- */
interface Props {
  environment: string;
  layers_construct: LayersConstruct;
}

export class PrinterCustomerProductsGETLambda extends Construct {
  public readonly function: NodejsFunction;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { table_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.function = new NodejsFunction(
      this,
      `Printer-CustomerProducts-GET-Function-${props.environment}`,
      {
        architecture: Architecture.ARM_64,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
        entry: path.resolve(__dirname, 'handler.ts'),
        environment: {
          TABLE_NAME: table_name,
        },
        functionName: `printer-customer-products-get-${props.environment.toLowerCase()}`,
        handler: 'handler',
        initialPolicy: [
          new PolicyStatement({
            actions: ['dynamodb:*'],
            resources: ['*'],
          }),
        ],
        layers: [props.layers_construct.layers.aws_lambda],
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
