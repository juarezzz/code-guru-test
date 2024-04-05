/* ---------- External ---------- */
import {
  LambdaIntegration,
  Resource,
  IRestApi,
  CfnAuthorizer,
} from 'aws-cdk-lib/aws-apigateway';
import { Role } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { ThirdPartyVerificationGETLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-verification/GET';
import { ThirdPartyVerificationPOSTLambda } from '_stacks/polytag-third-party-resources-stack/lambdas/api/third-party-verification/POST';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;
  cognito_third_party_authorizer: CfnAuthorizer;
  rest_api: IRestApi;
  queue_url: string;
}

export class ThirdPartyVerificationResource extends Construct {
  public readonly get: ThirdPartyVerificationGETLambda;

  public readonly post: ThirdPartyVerificationPOSTLambda;

  public readonly resource: Resource;

  public readonly role: Role;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource(
      'third-party-verification',
      {
        defaultCorsPreflightOptions: {
          allowHeaders: ['*'],
          allowOrigins: ['*'],
          allowMethods: ['GET', 'POST'],
        },
      },
    );

    /* ---------- Lambdas ---------- */
    this.post = new ThirdPartyVerificationPOSTLambda(
      this,
      `ThirdParty-Verification-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        queue_url: props.queue_url,
      },
    );

    this.get = new ThirdPartyVerificationGETLambda(
      this,
      `ThirdParty-Verification-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cognito_construct: props.cognito_construct,
        queue_url: props.queue_url,
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
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'third-party-verification',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'third-party-verification',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
