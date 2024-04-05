/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  Cors,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Lambdas ---------- */
import { PrinterLabelsPOSTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-labels/POST';
import { PrinterLabelsPUTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-labels/PUT';

/* ---------- Constructs ---------- */
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { Tags } from 'aws-cdk-lib';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;
  sqs_construct: SQSConstruct;

  rest_api: IRestApi;
}

export class PrinterLabelsResource extends Construct {
  public readonly post: PrinterLabelsPOSTLambda;

  public readonly put: PrinterLabelsPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('printer-labels', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['PUT', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new PrinterLabelsPOSTLambda(
      this,
      `Printer-Labels-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        sqs_construct: props.sqs_construct,
      },
    );

    this.put = new PrinterLabelsPUTLambda(
      this,
      `Printer-Labels-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        sqs_construct: props.sqs_construct,
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
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add('Custom:Child_Resource', 'printer-labels');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add('Custom:Child_Resource', 'printer-labels');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
