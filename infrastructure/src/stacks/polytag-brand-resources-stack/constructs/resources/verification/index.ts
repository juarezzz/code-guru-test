/* ---------- External ---------- */
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { VerificationGETLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/verification/GET';
import { VerificationPOSTLambda } from '_stacks/polytag-brand-resources-stack/lambdas/api/verification/POST';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class VerificationResource extends Construct {
  public readonly get: VerificationGETLambda;

  public readonly post: VerificationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('verification', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.get = new VerificationGETLambda(
      this,
      `Verification-GET-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
      },
    );

    this.post = new VerificationPOSTLambda(
      this,
      `Verification-POST-Lambda-${props.environment}`,
      {
        cors_allowed_origin: domain_name,
        cognito_construct: props.cognito_construct,
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod(
      'GET',
      new LambdaIntegration(this.get.function, { allowTestInvoke: false }),
    );

    this.resource.addMethod(
      'POST',
      new LambdaIntegration(this.post.function, { allowTestInvoke: false }),
    );

    /* ---------- Tags ---------- */
    Tags.of(this.get.function).add('Custom:Child_Resource', 'verification');
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    Tags.of(this.post.function).add('Custom:Child_Resource', 'verification');
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
