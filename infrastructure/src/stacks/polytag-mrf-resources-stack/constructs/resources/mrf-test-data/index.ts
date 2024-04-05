/* ---------- External ---------- */
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { MrfTestDataPOSTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-test-data/POST';
import { MrfTestDataDELETELambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-test-data/DELETE';

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

export class MrfTestDataResource extends Construct {
  public readonly post: MrfTestDataPOSTLambda;

  public readonly delete: MrfTestDataDELETELambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-test-data', {
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
    this.post = new MrfTestDataPOSTLambda(
      this,
      `MrfTestData-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.delete = new MrfTestDataDELETELambda(
      this,
      `MrfTestData-DELETE-Lambda-${props.environment}`,
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
    Tags.of(this.post).add('Custom:Child_Resource', 'mrf-test-data');
    Tags.of(this.post).add('Custom:Environment', props.environment);

    Tags.of(this.delete).add('Custom:Child_Resource', 'mrf-test-data');
    Tags.of(this.delete).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
