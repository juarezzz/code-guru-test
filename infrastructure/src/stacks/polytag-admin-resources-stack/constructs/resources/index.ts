/* ---------- External ---------- */
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { StateMachineConstruct } from '_stacks/backend-stack/constructs/StateMachine';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';

/* ---------- Resources ---------- */
import { AdminAuthenticationResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-authentication';
import { AdminBrandsResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-brands';
import { AdminBrandUsersResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-brand-users';
import { AdminClientsResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-clients';
import { AdminClientsStatusResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-clients-status';
import { AdminImageLibraryResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-image-library';
import { AdminInviteResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-invite';
import { AdminLandingPageTemplatesResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-landing-page-templates';
import { AdminMRFsResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-mrfs';
import { AdminMRFUsersResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-mrf-users';
import { AdminPrinterResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-printer';
import { AdminPrinterUsersResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-printer-users';
import { AdminThirdPartyResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-third-party';
import { AdminThirdPartyUsersResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-third-party-users';
import { AdminUsersResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-users';
import { AdminVerificationResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-verification';
import { AdminPrinterBrandAssociationsResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-printer-brand-associations';
import { AdminForgotPasswordResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-forgot-password';
import { AdminThirdPartyUserGroupsResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-third-party-user-groups';
import { AdminTestDataResource } from '_stacks/polytag-admin-resources-stack/constructs/resources/admin-test-data';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  cognito_authorizer: CfnAuthorizer;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers_construct: LayersConstruct;
  state_machine_construct: StateMachineConstruct;
  rest_api: IRestApi;
  buckets_construct: BucketsConstruct;
}

interface Resources {
  admin_authentication: AdminAuthenticationResource;
  admin_brands: AdminBrandsResource;
  admin_brand_users: AdminBrandUsersResource;
  admin_clients_status: AdminClientsStatusResource;
  admin_clients: AdminClientsResource;
  admin_image_library: AdminImageLibraryResource;
  admin_invite: AdminInviteResource;
  admin_landing_page_templates: AdminLandingPageTemplatesResource;
  admin_mrf_users: AdminMRFUsersResource;
  admin_mrfs: AdminMRFsResource;
  admin_printer: AdminPrinterResource;
  admin_printer_users: AdminPrinterUsersResource;
  admin_printer_brand_associations: AdminPrinterBrandAssociationsResource;
  admin_third_party_users: AdminThirdPartyUsersResource;
  admin_third_party: AdminThirdPartyResource;
  admin_users: AdminUsersResource;
  admin_verification: AdminVerificationResource;
  admin_forgot_password: AdminForgotPasswordResource;
  admin_third_party_user_groups: AdminThirdPartyUserGroupsResource;
  admin_test_data: AdminTestDataResource;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.resources = {
      admin_authentication: new AdminAuthenticationResource(
        this,
        `AdminAuthenticationResource-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_brands: new AdminBrandsResource(
        this,
        `AdminBrandsResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          cognito_construct: props.cognito_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_brand_users: new AdminBrandUsersResource(
        this,
        `AdminBrandUsersResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          environment: props.environment,
          layers_construct: props.layers_construct,
          cognito_construct: props.cognito_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_clients: new AdminClientsResource(
        this,
        `AdminClientsResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_authorizer: props.cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_clients_status: new AdminClientsStatusResource(
        this,
        `AdminClientsStatusResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          state_machine_construct: props.state_machine_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_image_library: new AdminImageLibraryResource(
        this,
        `AdminImageLibraryResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_invite: new AdminInviteResource(
        this,
        `AdminInviteResource-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          cognito_authorizer: props.cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),

      admin_verification: new AdminVerificationResource(
        this,
        `AdminVerificationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      admin_third_party: new AdminThirdPartyResource(
        this,
        `AdminThirdPartyResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_third_party_users: new AdminThirdPartyUsersResource(
        this,
        `AdminThirdPartyUsersResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_third_party_user_groups: new AdminThirdPartyUserGroupsResource(
        this,
        `AdminThirdPartyUserGroupsResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_users: new AdminUsersResource(
        this,
        `AdminUsersResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_landing_page_templates: new AdminLandingPageTemplatesResource(
        this,
        `AdminLandingPageTemplateResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      admin_printer: new AdminPrinterResource(
        this,
        `AdminPrinterResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          environment: props.environment,
          layers_construct: props.layers_construct,
          cognito_construct: props.cognito_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_printer_users: new AdminPrinterUsersResource(
        this,
        `AdminPrinterUsersResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      admin_printer_brand_associations:
        new AdminPrinterBrandAssociationsResource(
          this,
          `AdminPrinterBrandAssociationsResource-${props.environment}`,
          {
            cognito_authorizer: props.cognito_authorizer,
            environment: props.environment,
            layers_construct: props.layers_construct,
            rest_api: props.rest_api,
          },
        ),

      admin_mrfs: new AdminMRFsResource(
        this,
        `AdminMRFsResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      admin_mrf_users: new AdminMRFUsersResource(
        this,
        `AdminMRFUsersResource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_authorizer,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      admin_forgot_password: new AdminForgotPasswordResource(
        this,
        `AdminForgotPasswordResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      admin_test_data: new AdminTestDataResource(
        this,
        `AdminTestDataResource-${props.environment}`,
        {
          rest_api: props.rest_api,
          environment: props.environment,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          buckets_construct: props.buckets_construct,
        },
      ),
    };
  }
}
