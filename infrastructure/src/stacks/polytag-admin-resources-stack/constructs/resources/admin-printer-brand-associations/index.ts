/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminPrinterBrandAssociationsGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-brand-associations/GET';
import { AdminPrinterBrandAssociationsPUTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-brand-associations/PUT';
import { AdminPrinterBrandAssociationsDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-brand-associations/DELETE';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class AdminPrinterBrandAssociationsResource extends Construct {
  public readonly get: AdminPrinterBrandAssociationsGETLambda;

  public readonly put: AdminPrinterBrandAssociationsPUTLambda;

  public readonly delete: AdminPrinterBrandAssociationsDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'admin-printer-brand-associations',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: [
            `https://${admin_domain_name}`,
            ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
          ],
          allowMethods: ['GET', 'PUT', 'DELETE'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new AdminPrinterBrandAssociationsGETLambda(
      this,
      `Admin-Printer-BrandAssociations-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.put = new AdminPrinterBrandAssociationsPUTLambda(
      this,
      `Admin-Printer-BrandAssociations-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.delete = new AdminPrinterBrandAssociationsDELETELambda(
      this,
      `Admin-Printer-BrandAssociations-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
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
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-printer-brand-associations',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'admin-printer-brand-associations',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-printer-brand-associations',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
