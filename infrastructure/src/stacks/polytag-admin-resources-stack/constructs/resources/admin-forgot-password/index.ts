/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { AdminForgotPasswordGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-forgot-password/GET';
import { AdminForgotPasswordPUTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-forgot-password/PUT';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  cognito_construct: CognitoConstruct;

  rest_api: IRestApi;
}

export class AdminForgotPasswordResource extends Construct {
  public readonly get: AdminForgotPasswordGETLambda;

  public readonly put: AdminForgotPasswordPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-forgot-password', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new AdminForgotPasswordGETLambda(
      this,
      `Admin-ForgotPassword-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
      },
    );

    this.put = new AdminForgotPasswordPUTLambda(
      this,
      `Admin-ForgotPassword-PUT-Lambda-${props.environment}`,
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
        authorizationType: AuthorizationType.NONE,
      },
    );

    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.NONE,
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-forgot-password',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
