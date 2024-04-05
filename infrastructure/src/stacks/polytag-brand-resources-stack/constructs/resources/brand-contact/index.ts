/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  Resource,
  AuthorizationType,
  LambdaIntegration,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { BrandContactPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-contact/POST';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  rest_api: IRestApi;
  layers: Layers;
  environment: string;
}

export class BrandContactResource extends Construct {
  public readonly post: BrandContactPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-contact');

    /* ---------- Lambdas ---------- */
    this.post = new BrandContactPOSTLambda(
      this,
      `BrandContact-POST-Lambda-${props.environment}`,
      {
        layers: props.layers,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.NONE,
      },
    );

    /* ---------- CORS ---------- */
    this.resource.addCorsPreflight({
      allowHeaders: ['*'],
      allowOrigins: ['*'],
      allowMethods: ['POST'],
    });

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add('Custom:Child_Resource', 'brand-contact');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
