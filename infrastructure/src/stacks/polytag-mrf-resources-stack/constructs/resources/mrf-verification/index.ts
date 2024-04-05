/* ---------- External ---------- */
import {
  Cors,
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { MrfVerificationGETLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-verification/GET';
import { MrfVerificationPOSTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-verification/POST';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class MrfVerificationResource extends Construct {
  public readonly get: MrfVerificationGETLambda;

  public readonly post: MrfVerificationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-verification', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new MrfVerificationPOSTLambda(
      this,
      `Mrf-Verification-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    this.get = new MrfVerificationGETLambda(
      this,
      `Mrf-Verification-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.post).add('Custom:Child_Resource', 'mrf-verification');
    Tags.of(this.post).add('Custom:Environment', props.environment);

    Tags.of(this.get).add('Custom:Child_Resource', 'mrf-verification');
    Tags.of(this.get).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
