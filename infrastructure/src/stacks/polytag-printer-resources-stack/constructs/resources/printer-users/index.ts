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
import { PrinterUsersPUTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-users/PUT';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class PrinterUsersResource extends Construct {
  public readonly put: PrinterUsersPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('printer-users', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: ['PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.put = new PrinterUsersPUTLambda(
      this,
      `PrinterUsers-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.put.function).add('Custom:Child_Resource', 'printer-users');
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
