/* ---------- External ---------- */
import {
  AuthorizationType,
  CfnAuthorizer,
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { BrandBrandsDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-brands/DELETE';
import { BrandBrandsGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-brands/GET';
import { BrandBrandsPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-brands/POST';
import { BrandBrandsPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-brands/PUT';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  environment: string;
  rest_api: IRestApi;
}

export class BrandBrandsResource extends Construct {
  public readonly delete: BrandBrandsDELETELambda;

  public readonly get: BrandBrandsGETLambda;

  public readonly post: BrandBrandsPOSTLambda;

  public readonly put: BrandBrandsPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-brands', {
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
    this.post = new BrandBrandsPOSTLambda(
      scope,
      `Brand-Brands-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
      },
    );

    this.put = new BrandBrandsPUTLambda(
      scope,
      `Brand-Brands-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: domain_name,
      },
    );

    this.delete = new BrandBrandsDELETELambda(
      scope,
      `Brand-Brands-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        cors_allowed_origin: domain_name,
      },
    );

    this.get = new BrandBrandsGETLambda(
      scope,
      `Brand-Brands-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: domain_name,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'DELETE',
      new LambdaIntegration(this.delete.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add('Custom:Child_Resource', 'brand-brands');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'brand-brands');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'brand-brands');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add('Custom:Child_Resource', 'brand-brands');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
