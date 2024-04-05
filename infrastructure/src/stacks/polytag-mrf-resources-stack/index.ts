/* ---------- External ---------- */
import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Dependencies ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Constructs ---------- */
import { ResourcesConstruct } from '_stacks/polytag-mrf-resources-stack/constructs/resources';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;

  backend_stack: BackendStack;

  rest_api_id: string;
  root_resource_id: string;
}

export class PolytagMrfResourcesStack extends NestedStack {
  public readonly rest_api: IRestApi;

  public readonly mrf_resources: ResourcesConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.rest_api = RestApi.fromRestApiAttributes(
      this,
      `${props.environment}-RestApi-MRFResource`,
      {
        restApiId: props.rest_api_id,
        rootResourceId: props.root_resource_id,
      },
    );

    this.mrf_resources = new ResourcesConstruct(
      this,
      `Polytag-Mrf-Resources-${props.environment}`,
      {
        cognito_construct: props.backend_stack.cognito_construct,
        cognito_mrf_authorizer:
          props.backend_stack.lambda_authorizers.authorizer.mrf,
        environment: props.environment,
        layers_construct: props.backend_stack.layers_construct,
        dynamodb_construct: props.backend_stack.dynamodb_construct,
        kinesis_construct: props.backend_stack.kinesis_construct,
        rest_api: this.rest_api,
        buckets_construct: props.backend_stack.buckets_construct,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this).add('Custom:Resource', 'Mrf');
    Tags.of(scope).add('Custom:Environment', props.environment);
  }
}
