/* ---------- External ---------- */
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
  Resource,
  CfnAuthorizer,
  LambdaIntegration,
  AuthorizationType,
} from 'aws-cdk-lib/aws-apigateway';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Constructs ---------- */
import { IAMConstruct } from '_stacks/backend-stack/constructs/IAM';

/* ---------- Lambdas ---------- */
import { AnalyticsReachQRScansGETLambda } from '_stacks/polytag-analytics-resources-stack/lambdas/api/analytics-reach-qr-scans/GET';
import { Tags } from 'aws-cdk-lib';

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

export class AnalyticsReachQRScansResource extends Construct {
  public readonly get: AnalyticsReachQRScansGETLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.resource.addResource('qr-scans');

    /* ---------- Lambdas ---------- */
    this.get = new AnalyticsReachQRScansGETLambda(
      scope,
      `Analytics-Reach-QR-Scans-GET-Lambda-${props.environment}`,
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
      'analytics-reach/qr-scans',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
