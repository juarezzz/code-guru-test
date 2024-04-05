/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  CfnAuthorizer,
  AuthorizationType,
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Lambdas ---------- */
import { BrandGCPsPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-gcps/PUT';
import { BrandGCPsDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-gcps/DELETE';

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

export class BrandGCPsResource extends Construct {
  public readonly put: BrandGCPsPUTLambda;

  public readonly delete: BrandGCPsDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-gcps', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.put = new BrandGCPsPUTLambda(
      this,
      `BrandGCPs-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    this.delete = new BrandGCPsDELETELambda(
      this,
      `BrandGCPs-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
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

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
