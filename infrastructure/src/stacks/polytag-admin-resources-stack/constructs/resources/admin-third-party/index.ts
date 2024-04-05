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
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { AdminThirdPartyPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party/POST';
import { AdminThirdPartyGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party/GET';
import { AdminThirdPartyDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party/DELETE';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  layers_construct: LayersConstruct;
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;

  rest_api: IRestApi;
}

export class AdminThirdPartyResource extends Construct {
  public readonly post: AdminThirdPartyPOSTLambda;

  public readonly get: AdminThirdPartyGETLambda;

  public readonly delete: AdminThirdPartyDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-third-party', {
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
    this.post = new AdminThirdPartyPOSTLambda(
      this,
      `Admin-ThirdParty-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
      },
    );

    this.get = new AdminThirdPartyGETLambda(
      this,
      `Admin-ThirdParty-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.delete = new AdminThirdPartyDELETELambda(
      this,
      `Admin-ThirdParty-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
        cognito_construct: props.cognito_construct,
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

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-third-party',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-third-party',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);
    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-third-party',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
