/* ---------- External ---------- */
import { Construct } from 'constructs';
import { Role } from 'aws-cdk-lib/aws-iam';
import {
  AuthorizationType,
  CfnAuthorizer,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Lambdas ---------- */
import { AnalyticsSustainabilityRecentActivityGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-sustainability-recent-activity/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  resource: Resource;
  environment: string;
  cors_allowed_origin: string;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsSustainabilityRecentActivityResource extends Construct {
  public readonly get: AnalyticsSustainabilityRecentActivityGETLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.resource.addResource('recent-activity');

    /* ---------- Lambdas ---------- */
    this.get = new AnalyticsSustainabilityRecentActivityGETLambda(
      scope,
      `Analytics-Sustainability-RecentActivity-GET-Lambda-${props.environment}`,
      {
        layers: props.layers,
        environment: props.environment,
        cors_allowed_origin: props.cors_allowed_origin,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
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
      'analytics-sustainability/recent-activity',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
