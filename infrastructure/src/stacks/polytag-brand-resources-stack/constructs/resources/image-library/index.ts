/* ---------- External ---------- */
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Lambdas ---------- */
import { ImageLibraryGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/image-library/GET';
import { ImageLibraryDELETELambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/image-library/DELETE';
import { ImageLibraryLISTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/image-library/LIST';

/* ---------- Helpers ---------- */
import {
  add_inspector_tags,
  add_inspector_tags_to_function,
} from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Tags } from 'aws-cdk-lib';

/* ---------- Interfaces ---------- */
interface Props {
  buckets_construct: BucketsConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  cognito_authorizer: CfnAuthorizer;

  rest_api: IRestApi;
}

export class ImageLibraryResource extends Construct {
  public readonly get: ImageLibraryGETLambda;

  public readonly list: ImageLibraryLISTLambda;

  public readonly delete: ImageLibraryDELETELambda;

  public readonly resource: Resource;

  public readonly resource_list: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('image-library', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'DELETE'],
      },
    });

    this.resource_list = this.resource.addResource('list', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new ImageLibraryGETLambda(
      this,
      `ImageLibrary-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        environment: props.environment,
        buckets_construct: props.buckets_construct,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    this.delete = new ImageLibraryDELETELambda(
      this,
      `ImageLibrary-DELETE-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        buckets_construct: props.buckets_construct,
        environment: props.environment,
        dynamodb_construct: props.dynamodb_construct,
      },
    );

    this.list = new ImageLibraryLISTLambda(
      this,
      `ImageLibrary-LIST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'DELETE',
      new LambdaIntegration(this.delete.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    this.resource_list.addMethod(
      'GET',
      new LambdaIntegration(this.list.function, {
        allowTestInvoke: false,
      }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add('Custom:Child_Resource', 'image-library');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.delete.function).add('Custom:Child_Resource', 'image-library');
    Tags.of(this.delete.function).add('Custom:Environment', props.environment);

    Tags.of(this.list).add('Custom:Child_Resource', 'image-library/list');
    Tags.of(this.list).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') {
      add_inspector_tags(this);
      add_inspector_tags_to_function(this.list.function);
    }
  }
}
