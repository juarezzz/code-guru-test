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
import { BrandCampaignsDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-campaigns/DELETE';
import { BrandCampaignsGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-campaigns/GET';
import { BrandCampaignsPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-campaigns/POST';
import { BrandCampaignsPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-campaigns/PUT';

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

export class BrandCampaignsResource extends Construct {
  public readonly delete: BrandCampaignsDELETELambda;

  public readonly get: BrandCampaignsGETLambda;

  public readonly post: BrandCampaignsPOSTLambda;

  public readonly put: BrandCampaignsPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-campaigns', {
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
    this.delete = new BrandCampaignsDELETELambda(
      this,
      `BrandCampaigns-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.get = new BrandCampaignsGETLambda(
      this,
      `BrandCampaigns-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.post = new BrandCampaignsPOSTLambda(
      this,
      `BrandCampaigns-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.put = new BrandCampaignsPUTLambda(
      this,
      `BrandCampaigns-PUT-Lambda-${props.environment}`,
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
      'brand-campaigns',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add('Custom:Child_Resource', 'brand-campaigns');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add('Custom:Child_Resource', 'brand-campaigns');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'brand-campaigns');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
