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
import { PrinterForgotPasswordGETLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-forgot-password/GET';
import { PrinterForgotPasswordPUTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-forgot-password/PUT';

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

export class PrinterForgotPasswordResource extends Construct {
  public readonly get: PrinterForgotPasswordGETLambda;

  public readonly put: PrinterForgotPasswordPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('printer-forgot-password', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new PrinterForgotPasswordGETLambda(
      this,
      `Printer-ForgotPassword-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.put = new PrinterForgotPasswordPUTLambda(
      this,
      `Printer-ForgotPassword-PUT-Lambda-${props.environment}`,
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
      'printer-forgot-password',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'printer-forgot-password',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
