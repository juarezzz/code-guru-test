/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  LambdaIntegration,
  CfnAuthorizer,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { AdminBrandUsersDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-brand-users/DELETE';
import { AdminBrandUsersGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-brand-users/GET';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;
  cognito_construct: CognitoConstruct;

  rest_api: IRestApi;
}

export class AdminBrandUsersResource extends Construct {
  public readonly delete: AdminBrandUsersDELETELambda;

  public readonly get: AdminBrandUsersGETLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-brand-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.delete = new AdminBrandUsersDELETELambda(
      this,
      `Admin-Brand-Users-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
      },
    );

    this.get = new AdminBrandUsersGETLambda(
      this,
      `Admin-Brand-Users-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    /* ---------- Methods ---------- */
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
    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-brand-users',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-brand-users',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
