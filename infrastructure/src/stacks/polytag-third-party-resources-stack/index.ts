/* ---------- External ---------- */
import { Construct } from 'constructs';
import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Dependencies ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Constructs ---------- */
import { ResourcesConstruct } from '_stacks/polytag-third-party-resources-stack/constructs/resources';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;
  backend_stack: BackendStack;
  rest_api_id: string;
  root_resource_id: string;
}

export class PolytagThirdPartyResourcesStack extends NestedStack {
  public readonly rest_api: IRestApi;

  public readonly third_party_resources: ResourcesConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.rest_api = RestApi.fromRestApiAttributes(
      this,
      `${props.environment}-RestApi-ThirdPartyResource`,
      {
        restApiId: props.rest_api_id,
        rootResourceId: props.root_resource_id,
      },
    );

    this.third_party_resources = new ResourcesConstruct(
      this,
      `Polytag-Third-Party-Resources-${props.environment}`,
      {
        cognito_construct: props.backend_stack.cognito_construct,
        dynamodb_construct: props.backend_stack.dynamodb_construct,
        environment: props.environment,
        layers_construct: props.backend_stack.layers_construct,
        sqs_construct: props.backend_stack.sqs_construct,
        cognito_third_party_authorizer:
          props.backend_stack.lambda_authorizers.authorizer.third_party,
        rest_api: this.rest_api,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this).add('Custom:Resource', 'Third Party');
    Tags.of(this).add('Custom:Environment', props.environment);
  }
}
