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
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { AdminLandingPageTemplatesPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-landing-page-templates/POST';
import { AdminLandingPageTemplatesPUTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-landing-page-templates/PUT';
import { AdminLandingPageTemplatesDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-landing-page-templates/DELETE';
import { AdminLandingPageTemplatesGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-landing-page-templates/GET';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class AdminLandingPageTemplatesResource extends Construct {
  public readonly get: AdminLandingPageTemplatesGETLambda;

  public readonly post: AdminLandingPageTemplatesPOSTLambda;

  public readonly put: AdminLandingPageTemplatesPUTLambda;

  public readonly delete: AdminLandingPageTemplatesDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'admin-landing-page-templates',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: [
            `https://${admin_domain_name}`,
            ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
          ],
          allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.post = new AdminLandingPageTemplatesPOSTLambda(
      this,
      `Admin-LandingPageTemplates-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    this.put = new AdminLandingPageTemplatesPUTLambda(
      this,
      `Admin-LandingPageTemplates-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    this.delete = new AdminLandingPageTemplatesDELETELambda(
      this,
      `Admin-LandingPageTemplates-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    this.get = new AdminLandingPageTemplatesGETLambda(
      this,
      `Admin-LandingPageTemplates-GET-Lambda-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
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
      'admin-landing-page-templates',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-landing-page-templates',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'admin-landing-page-templates',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-landing-page-templates',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
