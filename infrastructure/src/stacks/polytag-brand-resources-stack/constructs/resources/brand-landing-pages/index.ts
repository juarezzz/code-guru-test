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
import { BrandLandingPagesDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-landing-pages/DELETE';
import { BrandLandingPagesGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-landing-pages/GET';
import { BrandLandingPagesPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-landing-pages/POST';
import { BrandLandingPagesPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-landing-pages/PUT';

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

export class BrandLandingPagesResource extends Construct {
  public readonly delete: BrandLandingPagesDELETELambda;

  public readonly get: BrandLandingPagesGETLambda;

  public readonly post: BrandLandingPagesPOSTLambda;

  public readonly put: BrandLandingPagesPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-landing-pages', {
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
    this.delete = new BrandLandingPagesDELETELambda(
      this,
      `Brand-Landing-Pages-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.get = new BrandLandingPagesGETLambda(
      this,
      `Brand-Landing-Pages-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.post = new BrandLandingPagesPOSTLambda(
      this,
      `Brand-Landing-Pages-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.put = new BrandLandingPagesPUTLambda(
      this,
      `Brand-Landing-Pages-PUT-Lambda-${props.environment}`,
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
      'brand-landing-pages',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'brand-landing-pages',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'brand-landing-pages',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'brand-landing-pages',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
