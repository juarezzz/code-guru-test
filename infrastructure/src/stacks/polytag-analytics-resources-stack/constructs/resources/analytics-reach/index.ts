/* ---------- External ---------- */
import { Construct } from 'constructs';
import * as api_gateway from 'aws-cdk-lib/aws-apigateway';
import { CfnAuthorizer } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Resources ---------- */
import { AnalyticsReachQRScansResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-qr-scans';
import { AnalyticsReachTopProductsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-top-products';
import { AnalyticsReachUniqueUsersResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-unique-users';
import { AnalyticsReachTopCampaignsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-top-campaigns';
import { AnalyticsReachQRScansLocationResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-qr-scans-location';
import { AnalyticsReachRecentActivitiesResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-recent-activities';
import { AnalyticsReachLandingPagesOpenResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-landing-pages-open';
import { AnalyticsReachTopLocationsByTimeResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-top-locations-by-time';
import { AnalyticsReachAverageTimeOnLandingPageResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-reach/analytics-average-time-on-landing-page';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  iam_construct: IAMConstruct;
  rest_api: api_gateway.IRestApi;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsReachResource extends Construct {
  public readonly qr_scans_resource: AnalyticsReachQRScansResource;

  public readonly top_products_resource: AnalyticsReachTopProductsResource;

  public readonly unique_users_resource: AnalyticsReachUniqueUsersResource;

  public readonly top_campaigns_resource: AnalyticsReachTopCampaignsResource;

  public readonly qr_scans_location_resource: AnalyticsReachQRScansLocationResource;

  public readonly recent_activities_resource: AnalyticsReachRecentActivitiesResource;

  public readonly landing_pages_open_resource: AnalyticsReachLandingPagesOpenResource;

  public readonly top_locations_by_time_resource: AnalyticsReachTopLocationsByTimeResource;

  public readonly average_time_on_landing_page_resource: AnalyticsReachAverageTimeOnLandingPageResource;

  public readonly resource: api_gateway.Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('analytics-reach', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET'],
      },
    });

    /* ---------- SubResources ---------- */
    this.qr_scans_resource = new AnalyticsReachQRScansResource(
      scope,
      `Analytics-Reach-QRScans-Resource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        iam_construct: props.iam_construct,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.top_products_resource = new AnalyticsReachTopProductsResource(
      scope,
      `Analytics-Reach-TopProducts-Resource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.unique_users_resource = new AnalyticsReachUniqueUsersResource(
      scope,
      `Analytics-Reach-UniqueUsers-Resource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.top_campaigns_resource = new AnalyticsReachTopCampaignsResource(
      scope,
      `Analytics-Reach-TopCampaigns-Resource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.qr_scans_location_resource = new AnalyticsReachQRScansLocationResource(
      scope,
      `Analytics-Reach-QRScansLocation-Resource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        iam_construct: props.iam_construct,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.recent_activities_resource =
      new AnalyticsReachRecentActivitiesResource(
        scope,
        `Analytics-Reach-RecentActivities-Resource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );

    this.landing_pages_open_resource =
      new AnalyticsReachLandingPagesOpenResource(
        scope,
        `Analytics-Reach-LandingPagesOpen-Resource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          iam_construct: props.iam_construct,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );

    this.top_locations_by_time_resource =
      new AnalyticsReachTopLocationsByTimeResource(
        scope,
        `Analytics-Reach-TopLocationsByTime-Resource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );

    this.average_time_on_landing_page_resource =
      new AnalyticsReachAverageTimeOnLandingPageResource(
        scope,
        `Analytics-Reach-AverageTimeOnLandingPage-Resource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          iam_construct: props.iam_construct,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );
  }
}
