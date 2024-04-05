/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  CfnAuthorizer,
  AuthorizationType,
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { BrandDomainsGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-domains/GET';
import { BrandDomainsPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-domains/PUT';
import { BrandDomainsDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-domains/DELETE';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  cognito_authorizer: CfnAuthorizer;

  rest_api: IRestApi;
}

export class BrandDomainsResource extends Construct {
  public readonly get: BrandDomainsGETLambda;

  public readonly put: BrandDomainsPUTLambda;

  public readonly delete: BrandDomainsDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-domains', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new BrandDomainsGETLambda(
      this,
      `BrandDomains-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.put = new BrandDomainsPUTLambda(
      this,
      `BrandDomains-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.delete = new BrandDomainsDELETELambda(
      this,
      `BrandDomains-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
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

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add('Custom:Child_Resource', 'brand-domains');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'brand-domains');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'brand-domains');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
