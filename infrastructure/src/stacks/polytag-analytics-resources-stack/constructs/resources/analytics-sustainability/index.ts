/* ---------- External ---------- */
import { Construct } from 'constructs';
import * as api_gateway from 'aws-cdk-lib/aws-apigateway';
import { CfnAuthorizer } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Resources ---------- */
import { AnalyticsSustainabilityUVScansResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability/analytics-uv-scans';
import { AnalyticsSustainabilityTagsPrintedResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability/analytics-tags-printed';
import { AnalyticsSustainabilityLocationMRFSResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability/analytics-location-mrfs';
import { AnalyticsSustainabilityRecentActivityResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability/analytics-recent-activity';
import { AnalyticsSustainabilityUVScansOvertimeResource } from '_stacks/polytag-analytics-resources-stack/constructs/resources/analytics-sustainability/analytics-uv-scans-overtime';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  environment: string;
  rest_api: api_gateway.IRestApi;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsSustainabilityResource extends Construct {
  public readonly uv_scans_resource: AnalyticsSustainabilityUVScansResource;

  public readonly tags_printed_resource: AnalyticsSustainabilityTagsPrintedResource;

  public readonly location_mrfs_resource: AnalyticsSustainabilityLocationMRFSResource;

  public readonly uv_scans_overtime_resource: AnalyticsSustainabilityUVScansOvertimeResource;

  public readonly recent_activity_resource: AnalyticsSustainabilityRecentActivityResource;

  public readonly resource: api_gateway.Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'analytics-sustainability',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: [
            `https://${domain_name}`,
            ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
          ],
          allowMethods: ['GET'],
        },
      },
    );

    /* ---------- SubResources ---------- */
    this.uv_scans_resource = new AnalyticsSustainabilityUVScansResource(
      scope,
      `Analytics-Sustainability-UVScansResource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.tags_printed_resource = new AnalyticsSustainabilityTagsPrintedResource(
      scope,
      `Analytics-Sustainability-TagsPrintedResource-${props.environment}`,
      {
        layers: props.layers,
        resource: this.resource,
        environment: props.environment,
        cors_allowed_origin: domain_name,
        analytics_cognito_authorizer: props.analytics_cognito_authorizer,
      },
    );

    this.location_mrfs_resource =
      new AnalyticsSustainabilityLocationMRFSResource(
        scope,
        `Analytics-Sustainability-Locatio0nMRFs-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );

    this.uv_scans_overtime_resource =
      new AnalyticsSustainabilityUVScansOvertimeResource(
        scope,
        `Analytics-Sustainability-UVScansOvertimeResource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );

    this.recent_activity_resource =
      new AnalyticsSustainabilityRecentActivityResource(
        scope,
        `Analytics-Sustainability-RecentActivityResource-${props.environment}`,
        {
          layers: props.layers,
          resource: this.resource,
          environment: props.environment,
          cors_allowed_origin: domain_name,
          analytics_cognito_authorizer: props.analytics_cognito_authorizer,
        },
      );
  }
}
