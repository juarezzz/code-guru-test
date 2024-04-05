/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Lambdas ---------- */
import { TestDataPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/test-data/POST';
import { TestDataDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/test-data/DELETE';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Interfaces ---------- */
interface Props {
  buckets_construct: BucketsConstruct;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  sqs_construct: SQSConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class TestDataResource extends Construct {
  public readonly delete: TestDataDELETELambda;

  public readonly post: TestDataPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('test-data', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['POST', 'DELETE'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new TestDataPOSTLambda(
      this,
      `TestData-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        sqs_construct: props.sqs_construct,
      },
    );

    this.delete = new TestDataDELETELambda(
      this,
      `TestData-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        buckets_construct: props.buckets_construct,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
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
    Tags.of(this.post.function).add('Custom:Child_Resource', 'test-data');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'test-data');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
