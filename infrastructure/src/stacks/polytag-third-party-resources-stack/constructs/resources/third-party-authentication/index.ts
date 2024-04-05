/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { ThirdPartyAuthenticationGETLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-authentication/GET';
import { ThirdPartyAuthenticationPOSTLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-authentication/POST';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  rest_api: IRestApi;
  queue_url: string;
}

export class ThirdPartyAuthenticationResource extends Construct {
  public readonly get: ThirdPartyAuthenticationGETLambda;

  public readonly post: ThirdPartyAuthenticationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'third-party-authentication',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new ThirdPartyAuthenticationGETLambda(
      this,
      `ThirdPartyAuthentication-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        layers_construct: props.layers_construct,
        queue_url: props.queue_url,
      },
    );

    this.post = new ThirdPartyAuthenticationPOSTLambda(
      this,
      `ThirdPartyAuthentication-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        layers_construct: props.layers_construct,
        queue_url: props.queue_url,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'third-party-authentication',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'third-party-authentication',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
