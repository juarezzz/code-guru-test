/* ---------- External ---------- */
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { AdminThirdPartyUserGroupsGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-third-party-user-groups/GET';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  rest_api: IRestApi;
}

export class AdminThirdPartyUserGroupsResource extends Construct {
  public readonly get: AdminThirdPartyUserGroupsGETLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'admin-third-party-user-groups',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: [
            `https://${admin_domain_name}`,
            ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
          ],
          allowMethods: ['GET'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new AdminThirdPartyUserGroupsGETLambda(
      this,
      `Admin-ThirdPartyUserGroups-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        layers_construct: props.layers_construct,
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

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-third-party-user-groups',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
