/* ---------- External ---------- */
import {
  IRestApi,
  Resource,
  CfnAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Constructs ---------- */
import { TimestreamConstruct } from '_stacks/backend-stack/constructs/Timestream';

/* ---------- Lambdas ---------- */
import { AnalyticsProductStatsGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-product-stats/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  rest_api: IRestApi;
  timestream_construct: TimestreamConstruct;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsProductStatsResource extends Construct {
  public readonly get: AnalyticsProductStatsGETLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('analytics-product-stats', {
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
    this.get = new AnalyticsProductStatsGETLambda(
      scope,
      `Analytics-Product-Stats-GET-Lambda-${props.environment}`,
      {
        layers: props.layers,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        timestream_construct: props.timestream_construct,
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
        authorizer: { authorizerId: props.analytics_cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'analytics-product-stats',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
