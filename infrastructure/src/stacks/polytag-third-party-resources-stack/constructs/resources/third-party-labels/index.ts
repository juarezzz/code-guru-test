/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  AuthorizationType,
  CfnAuthorizer,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';

/* ---------- Lambdas ---------- */
import { ThirdPartyLabelsPUTLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-labels/PUT';
import { ThirdPartyLabelsGETLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-labels/GET';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  cognito_third_party_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;
  rest_api: IRestApi;
  queue_url: string;
  labels_queue_url: string;
}

export class ThirdPartyLabelsResource extends Construct {
  public readonly get: ThirdPartyLabelsGETLambda;

  public readonly put: ThirdPartyLabelsPUTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('third-party-labels', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: ['*'],
        allowMethods: ['GET', 'PUT'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new ThirdPartyLabelsGETLambda(
      this,
      `ThirdPartyLabels-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
        queue_url: props.queue_url,
      },
    );

    this.put = new ThirdPartyLabelsPUTLambda(
      this,
      `ThirdPartyLabels-PUT-Lambda-${props.environment}`,
      {
        environment: props.environment,
        layers_construct: props.layers_construct,
        queue_url: props.queue_url,
        labels_queue_url: props.labels_queue_url,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_third_party_authorizer.ref },
      },
    );

    this.resource.addMethod(
      'PUT',
      new LambdaIntegration(this.put.function, { allowTestInvoke: false }),
      {
        authorizationType: AuthorizationType.COGNITO,
        authorizer: { authorizerId: props.cognito_third_party_authorizer.ref },
      },
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'third-party-labels',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.put.function).add(
      'Custom:Child_Resource',
      'third-party-labels',
    );
    Tags.of(this.put.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
