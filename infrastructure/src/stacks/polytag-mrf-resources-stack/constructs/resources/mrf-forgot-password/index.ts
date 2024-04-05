/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  Cors,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { MrfForgotPasswordGETLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-forgot-password/GET';
import { MrfForgotPasswordPUTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-forgot-password/PUT';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  cognito_construct: CognitoConstruct;

  rest_api: IRestApi;
}

export class MrfForgotPasswordResource extends Construct {
  public readonly get: MrfForgotPasswordGETLambda;

  public readonly put: MrfForgotPasswordPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-forgot-password', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new MrfForgotPasswordGETLambda(
      this,
      `Mrf-ForgotPassword-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.put = new MrfForgotPasswordPUTLambda(
      this,
      `Mrf-ForgotPassword-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
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
      'mrf-forgot-password',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'mrf-forgot-password',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
