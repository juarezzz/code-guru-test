/* ---------- External ---------- */
import { Construct } from 'constructs';
import { ISecret, Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { NestedStack, NestedStackProps, Tags } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Dependencies ---------- */
import { BackendStack } from '_stacks/backend-stack';

/* ---------- Constructs ---------- */
import { ResourcesConstruct } from '_stacks/polytag-brand-resources-stack/constructs/resources';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props extends NestedStackProps {
  environment: string;
  stack_name: string;
  backend_stack: BackendStack;
  rest_api_id: string;
  root_resource_id: string;
}

export class PolytagBrandResourcesStack extends NestedStack {
  public readonly rest_api: IRestApi;

  public readonly secret: ISecret;

  public readonly brand_resources: ResourcesConstruct;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id, props);

    this.rest_api = RestApi.fromRestApiAttributes(
      this,
      `${props.environment}-RestApi-BrandResource`,
      {
        restApiId: props.rest_api_id,
        rootResourceId: props.root_resource_id,
      },
    );

    const { secret_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    this.secret = Secret.fromSecretNameV2(
      this,
      `Secrets-${props.environment}`,
      secret_name,
    );

    this.brand_resources = new ResourcesConstruct(
      this,
      `Polytag-Brand-Resources-${props.environment}`,
      {
        environment: props.environment,
        buckets_construct: props.backend_stack.buckets_construct,
        cognito_construct: props.backend_stack.cognito_construct,
        sqs_construct: props.backend_stack.sqs_construct,
        dynamodb_construct: props.backend_stack.dynamodb_construct,
        layers: props.backend_stack.layers_construct.layers,
        state_machine_construct: props.backend_stack.state_machine_construct,
        brand_cognito_authorizer:
          props.backend_stack.lambda_authorizers.authorizer.brand,
        rest_api: this.rest_api,
        secret: this.secret,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this).add('Custom:Resource', 'Brand');
    Tags.of(this).add('Custom:Environment', props.environment);
  }
}
