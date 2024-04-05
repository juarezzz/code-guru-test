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
import { AdminMRFUsersGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrf-users/GET';
import { AdminMRFUsersPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrf-users/POST';
import { AdminMRFUsersDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-mrf-users/DELETE';

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

export class AdminMRFUsersResource extends Construct {
  public readonly get: AdminMRFUsersGETLambda;

  public readonly post: AdminMRFUsersPOSTLambda;

  public readonly delete: AdminMRFUsersDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-mrf-users', {
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
    this.get = new AdminMRFUsersGETLambda(
      this,
      `Admin-MRFUsers-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
      },
    );

    this.post = new AdminMRFUsersPOSTLambda(
      this,
      `Admin-MRFUsers-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new AdminMRFUsersDELETELambda(
      this,
      `Admin-MRFUsers-DELETE-Lambda-${props.environment}`,
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
    Tags.of(this.get.function).add('Custom:Child_Resource', 'admin-mrf-users');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add('Custom:Child_Resource', 'admin-mrf-users');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-mrf-users',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
