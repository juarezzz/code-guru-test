/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  Cors,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { MrfAuthenticationGETLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-authentication/GET';
import { MrfAuthenticationPOSTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-authentication/POST';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  dynamodb_construct: DynamoDBConstruct;

  rest_api: IRestApi;
}

export class MrfAuthenticationResource extends Construct {
  public readonly get: MrfAuthenticationGETLambda;

  public readonly post: MrfAuthenticationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-authentication', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new MrfAuthenticationGETLambda(
      this,
      `Mrf-Authentication-GET-Lambda-${props.environment}`,
      {
        cognito_construct: props.cognito_construct,
        environment: props.environment,
        layers_construct: props.layers_construct,
      },
    );

    this.post = new MrfAuthenticationPOSTLambda(
      this,
      `Mrf-Authentication-POST-Lambda-${props.environment}`,
      {
        cognito_construct: props.cognito_construct,
        environment: props.environment,
        layers_construct: props.layers_construct,
        dynamodb_construct: props.dynamodb_construct,
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
      'mrf-authentication',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'mrf-authentication',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
