/* ---------- External ---------- */
import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Dependencies ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Constructs ---------- */
import { ResourcesConstruct } from '_stacks/polytag-printer-resources-stack/constructs/resources';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;

  backend_stack: BackendStack;

  rest_api_id: string;
  root_resource_id: string;
}

export class PolytagPrinterResourcesStack extends NestedStack {
  public readonly rest_api: IRestApi;

  public readonly printer_resources: ResourcesConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.rest_api = RestApi.fromRestApiAttributes(
      this,
      `${props.environment}-RestApi-PrinterResource`,
      {
        restApiId: props.rest_api_id,
        rootResourceId: props.root_resource_id,
      },
    );

    this.printer_resources = new ResourcesConstruct(
      this,
      `Polytag-Printer-Resources-${props.environment}`,
      {
        cognito_construct: props.backend_stack.cognito_construct,
        cognito_printer_authorizer:
          props.backend_stack.lambda_authorizers.authorizer.printer,
        environment: props.environment,
        layers_construct: props.backend_stack.layers_construct,
        sqs_construct: props.backend_stack.sqs_construct,
        rest_api: this.rest_api,
        buckets_construct: props.backend_stack.buckets_construct,
        dynamodb_construct: props.backend_stack.dynamodb_construct,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this).add('Custom:Resource', 'Printer');
    Tags.of(scope).add('Custom:Environment', props.environment);
  }
}
