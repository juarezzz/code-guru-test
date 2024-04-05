/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminThirdPartyUsersGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party-users/GET';
import { AdminThirdPartyUsersPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party-users/POST';
import { AdminThirdPartyUsersDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party-users/DELETE';
import { AdminThirdPartyUsersPATCHLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party-users/PATCH';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

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

export class AdminThirdPartyUsersResource extends Construct {
  public readonly get: AdminThirdPartyUsersGETLambda;

  public readonly post: AdminThirdPartyUsersPOSTLambda;

  public readonly delete: AdminThirdPartyUsersDELETELambda;

  public readonly patch: AdminThirdPartyUsersPATCHLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-third-party-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST', 'DELETE', 'PATCH'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new AdminThirdPartyUsersPOSTLambda(
      this,
      `Admin-ThirdPartyUsers-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
      },
    );

    this.get = new AdminThirdPartyUsersGETLambda(
      this,
      `Admin-ThirdPartyUsers-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.delete = new AdminThirdPartyUsersDELETELambda(
      this,
      `Admin-ThirdPartyUsers-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.patch = new AdminThirdPartyUsersPATCHLambda(
      this,
      `Admin-ThirdPartyUsers-PATCH-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
        cors_allowed_origin: admin_domain_name,
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
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
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
      'PATCH',
      new LambdaIntegration(this.patch.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-third-party-users',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-third-party-users',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-third-party-users',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.patch.function).add(
      'Custom:Child_Resource',
      'admin-third-party-users',
    );
    Tags.of(this.patch.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
