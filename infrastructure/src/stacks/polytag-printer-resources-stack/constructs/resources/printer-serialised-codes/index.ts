/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  Cors,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { PrinterSerialisedCodesPOSTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-serialised-codes/POST';

/* ---------- Constructs ---------- */
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  sqs_construct: SQSConstruct;
  layers_construct: LayersConstruct;
  cognito_authorizer: CfnAuthorizer;

  rest_api: IRestApi;
}

export class PrinterSerialisedCodesResource extends Construct {
  public readonly post: PrinterSerialisedCodesPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'printer-serialised-codes',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: ['POST'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.post = new PrinterSerialisedCodesPOSTLambda(
      this,
      `Printer-SerialisedCodes-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        sqs_construct: props.sqs_construct,
        layers_construct: props.layers_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'printer-serialised-codes',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
