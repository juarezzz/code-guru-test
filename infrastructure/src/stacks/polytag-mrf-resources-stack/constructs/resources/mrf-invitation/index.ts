/* ---------- External ---------- */
import { Construct } from 'constructs';
import {
  LambdaIntegration,
  AuthorizationType,
  CfnAuthorizer,
  Resource,
  IRestApi,
  Cors,
} from 'aws-cdk-lib/aws-apigateway';
import { Tags } from 'aws-cdk-lib';

/* ---------- Lambdas ---------- */
import { MrfInvitationPOSTLambda } from '_stacks/polytag-mrf-resources-stack/lambdas/api/mrf-invitation/POST';

/* ---------- Helpers ---------- */
import { add_inspector_tags } from '_helpers/general/add-inspector-tags';

interface Props {
  cognito_authorizer: CfnAuthorizer;
  environment: string;

  rest_api: IRestApi;
}

export class MrfInvitationResource extends Construct {
  readonly post: MrfInvitationPOSTLambda;

  public readonly resource: Resource;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    /* ---------- Resources ---------- */
    this.resource = props.rest_api.root.addResource('mrf-invitation', {
      defaultCorsPreflightOptions: {
        allowHeaders: ['*'],
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: ['POST'],
      },
    });

    /* ---------- Lambdas ---------- */
    this.post = new MrfInvitationPOSTLambda(
      this,
      `Mrf-Invitation-POST-Lambda-${props.environment}`,
      {
        environment: props.environment,
      },
    );

    /* ---------- Methods ---------- */
    this.resource.addMethod('POST', new LambdaIntegration(this.post.function), {
      authorizationType: AuthorizationType.COGNITO,
      authorizer: { authorizerId: props.cognito_authorizer.ref },
    });

    /* ---------- Tags ---------- */
    Tags.of(this.post).add('Custom:Child_Resource', 'mrf-invitation');
    Tags.of(this.post).add('Custom:Environment', props.environment);

    if (props.environment !== 'STG') add_inspector_tags(this);
  }
}
