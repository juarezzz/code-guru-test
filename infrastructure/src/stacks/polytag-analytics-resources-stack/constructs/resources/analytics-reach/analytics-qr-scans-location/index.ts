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

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Constructs ---------- */
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';

/* ---------- Lambdas ---------- */
import { AnalyticsReachQRScansLocationGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-reach-qr-scans-location/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  layers: Layers;
  resource: Resource;
  environment: string;
  iam_construct: IAMConstruct;
  cors_allowed_origin: string;
  analytics_cognito_authorizer: CfnAuthorizer;
}

export class AnalyticsReachQRScansLocationResource extends Construct {
  public readonly get: AnalyticsReachQRScansLocationGETLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.resource.addResource('qr-scans-location');

    /* ---------- Lambdas ---------- */
    this.get = new AnalyticsReachQRScansLocationGETLambda(
      scope,
      `Analytics-Reach-QR-Scans-Location-GET-Lambda-${props.environment}`,
      {
        layers: props.layers,
        environment: props.environment,
        iam_construct: props.iam_construct,
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
      'analytics-reach/qr-scans-location',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
