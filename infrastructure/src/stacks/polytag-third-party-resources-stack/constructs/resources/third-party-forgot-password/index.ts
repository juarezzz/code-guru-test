/* ---------- External ---------- */
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
  LambdaIntegration,
  Resource,
  IRestApi,
  CfnAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { ThirdPartyForgotPasswordPUTLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-forgot-password/PUT';
import { ThirdPartyForgotPasswordGETLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-forgot-password/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  cognito_third_party_authorizer: CfnAuthorizer;
  rest_api: IRestApi;
  queue_url: string;
}

export class ThirdPartyForgotPasswordResource extends Construct {
  public readonly get: ThirdPartyForgotPasswordGETLambda;

  public readonly put: ThirdPartyForgotPasswordPUTLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'third-party-forgot-password',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: ['*'],
          allowMethods: ['GET', 'PUT'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.get = new ThirdPartyForgotPasswordGETLambda(
      this,
      `ThirdPartyForgotPassword-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        queue_url: props.queue_url,
      },
    );

    this.put = new ThirdPartyForgotPasswordPUTLambda(
      this,
      `ThirdPartyForgotPassword-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        queue_url: props.queue_url,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'third-party-forgot-password',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'third-party-forgot-password',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
