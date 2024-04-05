/* ---------- External ---------- */
import { Construct } from 'constructs';
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { KinesisConstruct } from '_stacks/backend-stack/constructs/Kinesis';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';

/* ---------- Resources ---------- */
import { MrfAuthenticationResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-authentication';
import { MrfScansResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-scans';
import { MrfVerificationResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-verification';
import { MrfForgotPasswordResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-forgot-password';
import { MrfInvitationResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-invitation';
import { MrfIngestResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-ingest';
import { MrfTestDataResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-test-data';
import { MrfHealthcheckResource } from '_stacks/polytag-mrf-resources-stack/constructs/resources/mrf-healthcheck';
import { MrfUsersResource } from './mrf-users';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_mrf_authorizer: CfnAuthorizer;
  cognito_construct: CognitoConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  buckets_construct: BucketsConstruct;
  dynamodb_construct: DynamoDBConstruct;
  kinesis_construct: KinesisConstruct;
  rest_api: IRestApi;
}

export interface Resources {
  mrf_authentication: MrfAuthenticationResource;
  mrf_scans: MrfScansResource;
  mrf_verification: MrfVerificationResource;
  mrf_forgot_password: MrfForgotPasswordResource;
  mrf_invitation: MrfInvitationResource;
  mrf_ingest: MrfIngestResource;
  mrf_test_data: MrfTestDataResource;
  mrf_healthcheck: MrfHealthcheckResource;
  mrf_users: MrfUsersResource;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.resources = {
      mrf_users: new MrfUsersResource(
        this,
        `MrfUsersResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          cognito_authorizer: props.cognito_mrf_authorizer,
          layers: props.layers_construct.layers,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      mrf_authentication: new MrfAuthenticationResource(
        this,
        `MrfAuthenticationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          dynamodb_construct: props.dynamodb_construct,
          rest_api: props.rest_api,
        },
      ),

      mrf_scans: new MrfScansResource(
        this,
        `MrfScansResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_mrf_authorizer,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      mrf_verification: new MrfVerificationResource(
        this,
        `MrfVerificationResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_construct: props.cognito_construct,
          rest_api: props.rest_api,
        },
      ),

      mrf_forgot_password: new MrfForgotPasswordResource(
        this,
        `MrfForgotPasswordResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      mrf_invitation: new MrfInvitationResource(
        this,
        `MrfInvitationResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_authorizer: props.cognito_mrf_authorizer,
          rest_api: props.rest_api,
        },
      ),

      mrf_ingest: new MrfIngestResource(
        this,
        `MrfIngestResource-${props.environment}`,
        {
          rest_api: props.rest_api,
          environment: props.environment,
          kinesis_construct: props.kinesis_construct,
          cognito_mrf_authorizer: props.cognito_mrf_authorizer,
        },
      ),

      mrf_test_data: new MrfTestDataResource(
        this,
        `MrfTestDataResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          buckets_construct: props.buckets_construct,
          rest_api: props.rest_api,
        },
      ),

      mrf_healthcheck: new MrfHealthcheckResource(
        this,
        `MrfHealthcheckResource-${props.environment}`,
        {
          environment: props.environment,
          rest_api: props.rest_api,
          cognito_authorizer: props.cognito_mrf_authorizer,
          layers_construct: props.layers_construct,
        },
      ),
    };
  }
}
