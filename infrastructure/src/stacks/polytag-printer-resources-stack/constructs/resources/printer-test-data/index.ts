/* ---------- External ---------- */
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { PrinterTestDataPOSTLambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-test-data/POST';
import { PrinterTestDataDELETELambda } from '_stacks/polytag-printer-resources-stack/lambdas/api/printer-test-data/DELETE';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

interface Props {
  environment: string;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  buckets_construct: BucketsConstruct;

  rest_api: IRestApi;
}

export class PrinterTestDataConstruct extends Construct {
  public readonly post: PrinterTestDataPOSTLambda;

  public readonly delete: PrinterTestDataDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('printer-test-data', {
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
    this.post = new PrinterTestDataPOSTLambda(
      this,
      `PrinterTestData-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new PrinterTestDataDELETELambda(
      this,
      `PrinterTestData-DELETE-Lambda-${props.environment}`,
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
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'printer-test-data',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add(
      'Custom:Child_Resource',
      'printer-test-data',
    );
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
