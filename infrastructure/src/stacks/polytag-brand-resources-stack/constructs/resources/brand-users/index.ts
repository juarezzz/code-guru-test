/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  CfnAuthorizer,
  AuthorizationType,
  LambdaIntegration,
  Resource,
  IRestApi,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { BrandUsersGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-users/GET';
import { BrandUsersPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-users/PUT';
import { BrandUsersDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/brand-users/DELETE';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  cognito_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;

  rest_api: IRestApi;
}

export class BrandUsersResource extends Construct {
  public readonly get: BrandUsersGETLambda;

  public readonly put: BrandUsersPUTLambda;

  public readonly delete: BrandUsersDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('brand-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'PUT', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new BrandUsersGETLambda(
      this,
      `BrandUsers-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        layers: props.layers,
        environment: props.environment,
      },
    );

    this.put = new BrandUsersPUTLambda(
      this,
      `BrandUsers-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        layers: props.layers,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new BrandUsersDELETELambda(
      this,
      `BrandUsers-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
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
    Tags.of(this.get.function).add('Custom:Child_Resource', 'brand-users');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'brand-users');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'brand-users');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
