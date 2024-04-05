/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Lambdas ---------- */
import { BrandAuthenticationGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-authentication/GET';
import { BrandAuthenticationPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-authentication/POST';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  rest_api: IRestApi;
}

export class BrandAuthenticationResource extends Construct {
  public readonly get: BrandAuthenticationGETLambda;

  public readonly post: BrandAuthenticationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-authentication', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new BrandAuthenticationGETLambda(
      this,
      `Brand-Authentication-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
      },
    );

    this.post = new BrandAuthenticationPOSTLambda(
      this,
      `Brand-Authentication-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
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
      'brand-authentication',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'brand-authentication',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
