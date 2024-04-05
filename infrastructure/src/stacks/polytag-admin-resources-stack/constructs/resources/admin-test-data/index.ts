/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { AdminTestDataPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-test-data/POST';
import { AdminTestDataDELETELambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-test-data/DELETE';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

interface Props {
  cognito_construct: CognitoConstruct;
  buckets_construct: BucketsConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  rest_api: IRestApi;
}

export class AdminTestDataResource extends Construct {
  public readonly post: AdminTestDataPOSTLambda;

  public readonly delete: AdminTestDataDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-test-data', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['POST', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new AdminTestDataPOSTLambda(
      this,
      `AdminTestData-POST-Lambda-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new AdminTestDataDELETELambda(
      this,
      `AdminTestData-DELETE-Lambda-${props.environment}`,
      {
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        buckets_construct: props.buckets_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'DELETE',
      new LambdaIntegration(this.delete.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post.function).add('Custom:Child_Resource', 'admin-test-data');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'admin-test-data',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
