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
import { BrandProductGroupsDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-groups/DELETE';
import { BrandProductGroupsGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-groups/GET';
import { BrandProductGroupsPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-groups/POST';
import { BrandProductGroupsPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-product-groups/PUT';

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

export class BrandProductGroupsResource extends Construct {
  public readonly delete: BrandProductGroupsDELETELambda;

  public readonly get: BrandProductGroupsGETLambda;

  public readonly post: BrandProductGroupsPOSTLambda;

  public readonly put: BrandProductGroupsPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-product-groups', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.delete = new BrandProductGroupsDELETELambda(
      this,
      `Brand-Product-Groups-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.get = new BrandProductGroupsGETLambda(
      this,
      `Brand-Product-Groups-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.post = new BrandProductGroupsPOSTLambda(
      this,
      `Brand-Product-Groups-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.put = new BrandProductGroupsPUTLambda(
      this,
      `Brand-Product-Groups-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'DELETE',
      new LambdaIntegration(this.delete.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

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
      'POST',
      new LambdaIntegration(this.post.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'brand-product-groups',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'brand-product-groups',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'brand-product-groups',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'brand-product-groups',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
