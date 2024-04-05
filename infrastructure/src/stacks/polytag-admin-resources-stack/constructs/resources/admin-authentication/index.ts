/* ---------- External ---------- */
import {
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminAuthenticationGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-authentication/GET';
import { AdminAuthenticationPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-authentication/POST';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class AdminAuthenticationResource extends Construct {
  public readonly get: AdminAuthenticationGETLambda;

  public readonly post: AdminAuthenticationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-authentication', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new AdminAuthenticationPOSTLambda(
      this,
      `Admin-Authentication-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
        dynamodb_construct: props.dynamodb_construct,
        layers_construct: props.layers_construct,
      },
    );

    this.get = new AdminAuthenticationGETLambda(
      this,
      `Admin-Authentication-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
        layers_construct: props.layers_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-authentication',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-authentication',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
