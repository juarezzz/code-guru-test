/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  CfnAuthorizer,
  AuthorizationType,
  LambdaIntegration,
  Resource,
  IRestApi,
  Cors,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { MrfUsersGETLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-users/GET';
import { MrfUsersPUTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-users/PUT';
import { MrfUsersDELETELambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-users/DELETE';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';
import { CDK } from '__@types/cdk';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;

  rest_api: IRestApi;
}

export class MrfUsersResource extends Construct {
  public readonly get: MrfUsersGETLambda;

  public readonly put: MrfUsersPUTLambda;

  public readonly delete: MrfUsersDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { rc_portal_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new MrfUsersGETLambda(
      this,
      `MrfUsers-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: rc_portal_domain_name,
        layers: props.layers,
        environment: props.environment,
      },
    );

    this.put = new MrfUsersPUTLambda(
      this,
      `MrfUsers-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: rc_portal_domain_name,
        layers: props.layers,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new MrfUsersDELETELambda(
      this,
      `MrfUsers-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: rc_portal_domain_name,
        layers: props.layers,
        environment: props.environment,
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
      'DELETE',
      new LambdaIntegration(this.delete.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add('Custom:Child_Resource', 'mrf-users');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'mrf-users');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'mrf-users');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
