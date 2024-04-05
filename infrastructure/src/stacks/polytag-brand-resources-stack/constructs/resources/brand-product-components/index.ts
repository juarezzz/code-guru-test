/* ---------- External ---------- */
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { BrandProductComponentsPATCHLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-components/PATCH';
import { BrandProductComponentsPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-components/POST';
import { BrandProductComponentsGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-components/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;

  rest_api: IRestApi;
}

export class BrandProductComponentsResource extends Construct {
  public readonly get: BrandProductComponentsGETLambda;

  public readonly patch: BrandProductComponentsPATCHLambda;

  public readonly post: BrandProductComponentsPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'brand-product-components',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: [
            `https://${domain_name}`,
            ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
          ],
          allowMethods: ['GET', 'POST', 'PATCH'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new BrandProductComponentsGETLambda(
      this,
      `Brand-Product-Components-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.patch = new BrandProductComponentsPATCHLambda(
      this,
      `Brand-Product-Components-PATCH-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.post = new BrandProductComponentsPOSTLambda(
      this,
      `Brand-Product-Components-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'PATCH',
      new LambdaIntegration(this.patch.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'brand-product-components',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.patch.function).add(
      'Custom:Child_Resource',
      'brand-product-components',
    );
    Tags.of(this.patch.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'brand-product-components',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
