/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { AnalyticsDisposalTopLocationsGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-disposal-top-locations/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  resource: Resource;
  environment: string;
  cors_allowed_origin: string;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsDisposalTopLocationsResource extends Construct {
  public readonly get: AnalyticsDisposalTopLocationsGETLambda;

  public readonly sub_resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.sub_resource = props.resource.addResource('top-locations');

    /* ---------- Lambdas ---------- */
    this.get = new AnalyticsDisposalTopLocationsGETLambda(
      scope,
      `Analytics-DisposalTopLocations-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: props.cors_allowed_origin,
      },
    );

    /* ---------- Methods ---------- */
    this.sub_resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.analytics_cognito_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'analytics-disposal/top-locations',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
