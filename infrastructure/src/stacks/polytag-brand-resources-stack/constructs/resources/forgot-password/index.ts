/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { ForgotPasswordGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/forgot-password/GET';
import { ForgotPasswordPUTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/forgot-password/PUT';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class ForgotPasswordResource extends Construct {
  public readonly get: ForgotPasswordGETLambda;

  public readonly put: ForgotPasswordPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('forgot-password', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new ForgotPasswordGETLambda(
      this,
      `ForgotPassword-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
      },
    );

    this.put = new ForgotPasswordPUTLambda(
      this,
      `ForgotPassword-PUT-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
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
    Tags.of(this.get.function).add('Custom:Child_Resource', 'forgot-password');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'forgot-password');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
