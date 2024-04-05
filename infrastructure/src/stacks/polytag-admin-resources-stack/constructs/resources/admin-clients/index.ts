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
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { AdminClientsGETLambda } from '_stacks/polytag-admin-resources-stack//lambdas/api/admin-clients/GET';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_authorizer: CfnAuthorizer;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class AdminClientsResource extends Construct {
  public readonly get: AdminClientsGETLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-clients', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new AdminClientsGETLambda(
      this,
      `Admin-Clients-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        dynamodb_construct: props.dynamodb_construct,
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
    Tags.of(this.get.function).add('Custom:Child_Resource', 'admin-clients');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
