/* ---------- External ---------- */
import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Dependencies ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Constructs ---------- */
import { ResourcesConstruct } from '_stacks/polytag-analytics-resources-stack/constructs/resources';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;

  backend_stack: BackendStack;

  rest_api_id: string;
  root_resource_id: string;
}

export class PolytagAnalyticsResourcesStack extends NestedStack {
  public readonly rest_api: IRestApi;

  public readonly analytics_resources: ResourcesConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.rest_api = RestApi.fromRestApiAttributes(
      this,
      `${props.environment}-RestApi-AnalyticsResource`,
      {
        restApiId: props.rest_api_id,
        rootResourceId: props.root_resource_id,
      },
    );

    this.analytics_resources = new ResourcesConstruct(
      this,
      `Polytag-Analytics-Resources-${props.environment}`,
      {
        environment: props.environment,
        iam_construct: props.backend_stack.iam_construct,
        layers: props.backend_stack.layers_construct.layers,
        layers_construct: props.backend_stack.layers_construct,
        kinesis_construct: props.backend_stack.kinesis_construct,
        timestream_construct: props.backend_stack.timestream_construct,
        analytics_cognito_authorizer:
          props.backend_stack.lambda_authorizers.authorizer.brand,
        rest_api: this.rest_api,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this).add('Custom:Resource', 'Analytics');
    Tags.of(this).add('Custom:Environment', props.environment);
  }
}
