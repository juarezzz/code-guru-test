/* ---------- External ---------- */
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
  Resource,
  CfnAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Lambdas ---------- */
import { AnalyticsReachTopCampaignsGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-reach-top-campaigns/GET';

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

export class AnalyticsReachTopCampaignsResource extends Construct {
  public readonly get: AnalyticsReachTopCampaignsGETLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.resource.addResource('top-campaigns');

    /* ---------- Lambdas ---------- */
    this.get = new AnalyticsReachTopCampaignsGETLambda(
      scope,
      `Analytics-Reach-Top-Campaigns-GET-Lambda-${props.environment}`,
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
      'analytics-reach/top-campaigns',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
