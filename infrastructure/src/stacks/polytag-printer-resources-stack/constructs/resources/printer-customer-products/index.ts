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
import { PrinterCustomerProductsGETLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-customer-products/GET';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class PrinterCustomerProductsResource extends Construct {
  public readonly get: PrinterCustomerProductsGETLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'printer-customer-products',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: Cors.ALL_ORIGINS,
          allowMethods: ['GET'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new PrinterCustomerProductsGETLambda(
      this,
      `Printer-CustomerProducts-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'printer-customer-products',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
