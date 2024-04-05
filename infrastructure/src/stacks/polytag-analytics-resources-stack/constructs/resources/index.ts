/* ---------- External ---------- */
import { Construct } from 'constructs';
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';
import { TimestreamConstruct } from '_stacks/backend-stack/constructs/Timestream';

/* ---------- Resources ---------- */
import { AnalyticsReachResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach';
import { AnalyticsDisposalResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal';
import { AnalyticsLandingPageResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-landing-page';
import { AnalyticsProductStatsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-product-stats';
import { AnalyticsSustainabilityResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Interfaces ---------- */
export interface Resources {
  analytics_reach: AnalyticsReachResource;
  analytics_disposal: AnalyticsDisposalResource;
  analytics_landing_page: AnalyticsLandingPageResource;
  analytics_product_stats: AnalyticsProductStatsResource;
  analytics_sustainability: AnalyticsSustainabilityResource;
}

interface Props {
  layers: Layers;
  environment: string;
  iam_construct: IAMConstruct;
  layers_construct: LayersConstruct;
  kinesis_construct: KinesisConstruct;
  timestream_construct: TimestreamConstruct;
  analytics_cognito_authorizer: CfnAuthorizer;
  rest_api: IRestApi;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.resources = {
      analytics_reach: new AnalyticsReachResource(
        scope,
        `Analytics-Reach-Resource-${props.environment}`,
        {
          layers: props.layers,
          rest_api: props.rest_api,
          environment: props.environment,
          iam_construct: props.iam_construct,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      ),

      analytics_landing_page: new AnalyticsLandingPageResource(
        scope,
        `Analytics-Landing-Page-Resource-${props.environment}`,
        {
          environment: props.environment,
          kinesis_construct: props.kinesis_construct,
          rest_api: props.rest_api,
        },
      ),

      analytics_disposal: new AnalyticsDisposalResource(
        scope,
        `Analytics-DisposalResource-${props.environment}`,
        {
          environment: props.environment,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),

      analytics_product_stats: new AnalyticsProductStatsResource(
        scope,
        `Analytics-ProductStatsResource-${props.environment}`,
        {
          layers: props.layers,
          rest_api: props.rest_api,
          environment: props.environment,
          timestream_construct: props.timestream_construct,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      ),

      analytics_sustainability: new AnalyticsSustainabilityResource(
        scope,
        `Analytics-SustainabilityResource-${props.environment}`,
        {
          layers: props.layers,
          environment: props.environment,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),
    };
  }
}
