/* ---------- External ---------- */
import {
  IRestApi,
  LambdaIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Tags } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';

/* ---------- Lambdas ---------- */
import { AdminVerificationGETLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-verification/GET';
import { AdminVerificationPOSTLambda } from '_stacks/polytag-admin-resources-stack/lambdas/api/admin-verification/POST';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  environment: string;

  rest_api: IRestApi;
}

export class AdminVerificationResource extends Construct {
  public readonly get: AdminVerificationGETLambda;

  public readonly post: AdminVerificationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { admin_domain_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );
    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('admin-verification', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: [
          `https://${admin_domain_name}`,
          ...(props.environment !== 'PROD' ? ['http://localhost:3000'] : []),
        ],
        allowMethods: ['GET', 'POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new AdminVerificationPOSTLambda(
      this,
      `Admin-Verification-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
        cognito_construct: props.cognito_construct,
      },
    );

    this.get = new AdminVerificationGETLambda(
      this,
      `Admin-Verification-GET-Lambda-${props.environment}`,
      {
        environment: props.environment,
        cors_allowed_origin: admin_domain_name,
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
    Tags.of(this.post.function).add(
      'Custom:Child_Resource',
      'admin-verification',
    );
    Tags.of(this.post.function).add('Custom:Environment', props.environment);

    Tags.of(this.get.function).add(
      'Custom:Child_Resource',
      'admin-verification',
    );
    Tags.of(this.get.function).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
