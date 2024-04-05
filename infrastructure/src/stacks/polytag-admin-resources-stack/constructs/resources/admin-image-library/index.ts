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
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminImageLibraryDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-image-library/DELETE';
import { AdminImageLibraryGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-image-library/GET';
import { AdminImageLibraryPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-image-library/POST';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;

  rest_api: IRestApi;
}

export class AdminImageLibraryResource extends Construct {
  public readonly delete: AdminImageLibraryDELETELambda;

  public readonly get: AdminImageLibraryGETLambda;

  public readonly post: AdminImageLibraryPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-image-library', {
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
    this.delete = new AdminImageLibraryDELETELambda(
      this,
      `Admin-Image-Library-DELETE-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.get = new AdminImageLibraryGETLambda(
      this,
      `Admin-Image-Library-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
      },
    );

    this.post = new AdminImageLibraryPOSTLambda(
      this,
      `Admin-Image-Library-POST-Lambda-${props.environment}`,
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

    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-image-library',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-image-library',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-image-library',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
