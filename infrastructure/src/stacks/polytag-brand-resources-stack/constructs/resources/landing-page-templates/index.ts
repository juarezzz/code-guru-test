/* ---------- External ---------- */
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { LandingPageTemplatesGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/landing-page-templates/GET';

/* ---------- Constructs ---------- */
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  dynamodb_construct: DynamoDBConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class LandingPageTemplatesResource extends Construct {
  public readonly get: LandingPageTemplatesGETLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('landing-page-templates', {
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
    this.get = new LandingPageTemplatesGETLambda(
      this,
      `LandingPageTemplates-GET-Lambda-${props.environment}`,
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
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'landing-page-templates',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
