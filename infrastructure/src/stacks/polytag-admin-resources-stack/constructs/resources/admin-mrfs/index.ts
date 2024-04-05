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

/* ---------- Lambdas ---------- */
import { AdminMrfsGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrfs/GET';
import { AdminMrfsPUTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrfs/PUT';
import { AdminMrfsPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrfs/POST';
import { AdminMrfsDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrfs/DELETE';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  environment: string;
  rest_api: IRestApi;
}

export class AdminMRFsResource extends Construct {
  public readonly get: AdminMrfsPUTLambda;

  public readonly put: AdminMrfsPUTLambda;

  public readonly post: AdminMrfsPOSTLambda;

  public readonly delete: AdminMrfsDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-mrfs', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new AdminMrfsGETLambda(
      this,
      `Admin-Mrfs-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.put = new AdminMrfsPUTLambda(
      this,
      `Admin-Mrfs-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.post = new AdminMrfsPOSTLambda(
      this,
      `Admin-Mrfs-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.delete = new AdminMrfsDELETELambda(
      this,
      `Admin-Mrfs-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
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
    Tags.of(this.get.function).add('Custom:Child_Resource', 'admin-mrfs');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add('Custom:Child_Resource', 'admin-mrfs');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add('Custom:Child_Resource', 'admin-mrfs');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add('Custom:Child_Resource', 'admin-mrfs');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
