/* ---------- External ---------- */
import { Construct } from 'constructs';
import * as api_gateway from 'aws-cdk-lib/aws-apigateway';
import { CfnAuthorizer } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Resources ---------- */
import { AnalyticsDisposalQRScansResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-qr-scans';
import { AnalyticsDisposalTopProductsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-top-products';
import { AnalyticsDisposalTopLocationsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-top-locations';
import { AnalyticsDisposalTopCampaignsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-top-campaigns';
import { AnalyticsDisposalRecentActivityResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-recent-activity';
import { AnalyticsDisposalQRScansLocationsResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-disposal/analytics-qr-scans-locations';

/* ---------- Interfaces ---------- */
interface Props {
  environment: string;
  rest_api: api_gateway.IRestApi;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsDisposalResource extends Construct {
  public readonly qr_scans_resource: AnalyticsDisposalQRScansResource;

  public readonly top_products_resource: AnalyticsDisposalTopProductsResource;

  public readonly top_locations_resource: AnalyticsDisposalTopLocationsResource;

  public readonly top_campaigns_resource: AnalyticsDisposalTopCampaignsResource;

  public readonly recent_activity_resource: AnalyticsDisposalRecentActivityResource;

  public readonly qr_scans_locations_resource: AnalyticsDisposalQRScansLocationsResource;

  public readonly resource: api_gateway.Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('analytics-disposal', {
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
    this.qr_scans_resource = new AnalyticsDisposalQRScansResource(
      scope,
      `Analytics-DisposalQRScansResource-${props.environment}`,
      {
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.top_products_resource = new AnalyticsDisposalTopProductsResource(
      scope,
      `Analytics-DisposalTopProductsResource-${props.environment}`,
      {
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.top_locations_resource = new AnalyticsDisposalTopLocationsResource(
      scope,
      `Analytics-DisposalTopLocationsResource-${props.environment}`,
      {
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.top_campaigns_resource = new AnalyticsDisposalTopCampaignsResource(
      scope,
      `Analytics-DisposalTopCampaignsResource-${props.environment}`,
      {
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.recent_activity_resource = new AnalyticsDisposalRecentActivityResource(
      scope,
      `Analytics-DisposalRecentActivityResource-${props.environment}`,
      {
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.qr_scans_locations_resource =
      new AnalyticsDisposalQRScansLocationsResource(
        scope,
        `Analytics-DisposalQRSCansLocationsResource-${props.environment}`,
        {
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );
  }
}
