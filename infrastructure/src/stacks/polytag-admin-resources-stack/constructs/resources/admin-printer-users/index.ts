/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminPrinterUsersGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-users/GET';
import { AdminPrinterUsersPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-users/POST';
import { AdminPrinterUsersDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-printer-users/DELETE';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class AdminPrinterUsersResource extends Construct {
  public readonly get: AdminPrinterUsersGETLambda;

  public readonly post: AdminPrinterUsersPOSTLambda;

  public readonly delete: AdminPrinterUsersDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-printer-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new AdminPrinterUsersGETLambda(
      this,
      `Admin-Printer-Users-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.post = new AdminPrinterUsersPOSTLambda(
      this,
      `Admin-Printer-Users-POST-Lambda-${props.environment}`,
      {
        cognito_construct: props.cognito_construct,
        environment: props.environment,
        layers_construct: props.layers_construct,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.delete = new AdminPrinterUsersDELETELambda(
      this,
      `Admin-Printer-Users-Delete-Lambda-${props.environment}`,
      {
        cognito_construct: props.cognito_construct,
        environment: props.environment,
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
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
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
      'admin-printer-users',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-printer-users',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-printer-users',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
