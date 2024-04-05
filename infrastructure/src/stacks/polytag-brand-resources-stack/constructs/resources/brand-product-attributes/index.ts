/* ---------- External ---------- */
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Lambdas ---------- */
import { BrandProductAttributesPATCHLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-attributes/PATCH';
import { BrandProductAttributesPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-attributes/POST';
import { BrandProductAttributesGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-attributes/GET';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;

  rest_api: IRestApi;
}

export class BrandProductAttributesResource extends Construct {
  public readonly get: BrandProductAttributesGETLambda;

  public readonly patch: BrandProductAttributesPATCHLambda;

  public readonly post: BrandProductAttributesPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'brand-product-attributes',
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
    this.get = new BrandProductAttributesGETLambda(
      this,
      `Brand-Product-Attributes-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.patch = new BrandProductAttributesPATCHLambda(
      this,
      `Brand-Product-Attributes-PATCH-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.post = new BrandProductAttributesPOSTLambda(
      this,
      `Brand-Product-Attributes-POST-Lambda-${props.environment}`,
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
      'brand-product-attributes',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.patch.function).add(
      'Custom:Child_Resource',
      'brand-product-attributes',
    );
    Tags.of(this.patch.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'brand-product-attributes',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
