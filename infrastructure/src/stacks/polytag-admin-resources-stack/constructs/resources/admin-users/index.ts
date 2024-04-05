/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  LambdaIntegration,
  CfnAuthorizer,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { AdminUsersDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-users/DELETE';
import { AdminUsersGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-users/GET';
import { AdminUsersPATCHLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-users/PATCH';
import { AdminUsersPUTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-users/PUT';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class AdminUsersResource extends Construct {
  public readonly delete: AdminUsersDELETELambda;

  public readonly get: AdminUsersGETLambda;

  public readonly patch: AdminUsersPATCHLambda;

  public readonly put: AdminUsersPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'PUT', 'PATCH', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.delete = new AdminUsersDELETELambda(
      this,
      `Admin-Users-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        cognito_construct: props.cognito_construct,
        layers_construct: props.layers_construct,
      },
    );

    this.get = new AdminUsersGETLambda(
      this,
      `Admin-Users-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
      },
    );

    this.patch = new AdminUsersPATCHLambda(
      this,
      `Admin-Users-PATCH-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
      },
    );

    this.put = new AdminUsersPUTLambda(
      this,
      `Admin-Users-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
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

    this.resource.addMethod(
      'PATCH',
      new LambdaIntegration(this.patch.function, { allowTestInvoke: false }),
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

    /* ---------- Tags ---------- */
    Tags.of(this.delete.function).add('Custom:Child_Resource', 'admin-users');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add('Custom:Child_Resource', 'admin-users');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.patch.function).add('Custom:Child_Resource', 'admin-users');
    Tags.of(this.patch.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'admin-users');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
