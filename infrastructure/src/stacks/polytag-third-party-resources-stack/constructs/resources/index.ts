/* ---------- External ---------- */
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { Stack } from 'aws-cdk-lib';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';

/* ---------- Resources ---------- */
import { ThirdPartyAuthenticationResource } from '_stacks/polytag-third-party-resources-stack/constructs/resources/third-party-authentication';
import { ThirdPartyLabelsResource } from '_stacks/polytag-third-party-resources-stack/constructs/resources/third-party-labels';
import { ThirdPartyVerificationResource } from '_stacks/polytag-third-party-resources-stack/constructs/resources/third-party-verification';
import { ThirdPartyForgotPasswordResource } from '_stacks/polytag-third-party-resources-stack/constructs/resources/third-party-forgot-password';

/* ---------- Types ---------- */
import { CDK } from '__@types/cdk';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_third_party_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  sqs_construct: SQSConstruct;
  rest_api: IRestApi;
}

export interface Resources {
  third_party_authentication: ThirdPartyAuthenticationResource;
  third_party_verification: ThirdPartyVerificationResource;
  third_party_labels: ThirdPartyLabelsResource;
  third_party_forgot_password: ThirdPartyForgotPasswordResource;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    const { region, logs_queue_name }: CDK.Context = this.node.tryGetContext(
      props.environment,
    );

    const { account } = Stack.of(this);

    const queue_url = `https://sqs.${region}.amazonaws.com/${account}/${logs_queue_name}-${props.environment}`;

    this.resources = {
      third_party_authentication: new ThirdPartyAuthenticationResource(
        this,
        `ThirdPartyAuthenticationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
          queue_url,
        },
      ),
      third_party_verification: new ThirdPartyVerificationResource(
        this,
        `ThirdPartyVerificationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          cognito_third_party_authorizer: props.cognito_third_party_authorizer,
          rest_api: props.rest_api,
          queue_url,
        },
      ),
      third_party_labels: new ThirdPartyLabelsResource(
        this,
        `ThirdPartyLabelsResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          cognito_third_party_authorizer: props.cognito_third_party_authorizer,
          rest_api: props.rest_api,
          labels_queue_url: props.sqs_construct.queues.labels_queue.queueUrl,
          queue_url,
        },
      ),
      third_party_forgot_password: new ThirdPartyForgotPasswordResource(
        this,
        `ThirdPartyForgotPasswordResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          cognito_third_party_authorizer: props.cognito_third_party_authorizer,
          rest_api: props.rest_api,
          queue_url,
        },
      ),
    };
  }
}
