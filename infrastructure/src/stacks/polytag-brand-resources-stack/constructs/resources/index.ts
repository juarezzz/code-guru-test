/* ---------- External ---------- */
import { Construct } from 'constructs';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';

/* ---------- Types ---------- */
import { Layers } from '_stacks/backend-stack/constructs/Layers/@types';

/* ---------- Constructs ---------- */
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';
import { StateMachineConstruct } from '_stacks/backend-stack/constructs/StateMachine';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';

/* ---------- Resources ---------- */
import { BrandAuthenticationResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-authentication';
import { BrandBrandsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-brands';
import { BrandCampaignsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-campaigns';
import { BrandContactResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-contact';
import { BrandDisplayPageResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-display-page';
import { BrandDomainsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-domains';
import { BrandGCPsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-gcps';
import { BrandLandingPagesResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-landing-pages';
import { BrandProductGroupsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-product-groups';
import { BrandProductAttributesResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-product-attributes';
import { BrandProductComponentsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-product-components';
import { BrandProductsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-products';
import { BrandUsersResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/brand-users';
import { BatchUploadResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/batch-upload';
import { BatchUploadProductGroupsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/batch-upload-product-groups';
import { ForgotPasswordResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/forgot-password';
import { GS1CheckerResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/gs1-checker';
import { ImageLibraryResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/image-library';
import { InviteResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/invite';
import { LandingPagesPreviewResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/landing-pages-preview';
import { LandingPageTemplatesResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/landing-page-templates';
import { MrfsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/mrfs';
import { PopulateCronSettingsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/populate-cron-settings';
import { UserAttributesResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/users-attributes';
import { UsersResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/users';
import { VerificationResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/verification';
import { TestDataResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/test-data';
import { CampaignEventsResource } from '_stacks/polytag-brand-resources-stack/constructs/resources/campaign-events';

/* ---------- Interfaces ---------- */
interface Props {
  brand_cognito_authorizer: CfnAuthorizer;
  buckets_construct: BucketsConstruct;
  cognito_construct: CognitoConstruct;
  dynamodb_construct: DynamoDBConstruct;
  environment: string;
  layers: Layers;
  state_machine_construct: StateMachineConstruct;
  rest_api: IRestApi;
  secret: ISecret;
  sqs_construct: SQSConstruct;
}

export interface Resources {
  batch_upload: BatchUploadResource;
  batch_upload_product_groups: BatchUploadProductGroupsResource;
  brand_authentication: BrandAuthenticationResource;
  brand_brands: BrandBrandsResource;
  brand_campaigns: BrandCampaignsResource;
  brand_contact: BrandContactResource;
  brand_display_page: BrandDisplayPageResource;
  brand_domains: BrandDomainsResource;
  brand_gcps: BrandGCPsResource;
  brand_landing_pages: BrandLandingPagesResource;
  brand_product_groups: BrandProductGroupsResource;
  brand_product_attributes: BrandProductAttributesResource;
  brand_product_components: BrandProductComponentsResource;
  brand_products: BrandProductsResource;
  brand_users: BrandUsersResource;
  forgot_password: ForgotPasswordResource;
  gs1_checker: GS1CheckerResource;
  image_library: ImageLibraryResource;
  invite: InviteResource;
  landing_page_templates: LandingPageTemplatesResource;
  landing_pages_preview: LandingPagesPreviewResource;
  mrfs: MrfsResource;
  populate_cron_settings: PopulateCronSettingsResource;
  user_attributes: UserAttributesResource;
  users: UsersResource;
  verification: VerificationResource;
  test_data: TestDataResource;
  campaign_events: CampaignEventsResource;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.resources = {
      brand_authentication: new BrandAuthenticationResource(
        this,
        `BrandAuthenticationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_brands: new BrandBrandsResource(
        scope,
        `BrandBrands-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_campaigns: new BrandCampaignsResource(
        this,
        `BrandCampaignsResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_contact: new BrandContactResource(
        this,
        `BrandContact-${props.environment}`,
        {
          rest_api: props.rest_api,
          layers: props.layers,
          environment: props.environment,
        },
      ),

      brand_display_page: new BrandDisplayPageResource(
        this,
        `BrandDisplayPageResource-${props.environment}`,
        {
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_domains: new BrandDomainsResource(
        this,
        `BrandDomainsResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_authorizer: props.brand_cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),

      brand_gcps: new BrandGCPsResource(
        this,
        `BrandGCPsResource-${props.environment}`,
        {
          environment: props.environment,
          cognito_authorizer: props.brand_cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),

      brand_landing_pages: new BrandLandingPagesResource(
        this,
        `BrandLandingPagesResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_product_groups: new BrandProductGroupsResource(
        this,
        `BrandProductGroupsResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_product_attributes: new BrandProductAttributesResource(
        this,
        `BrandProductAttributesResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_product_components: new BrandProductComponentsResource(
        this,
        `BrandProductComponentsResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_products: new BrandProductsResource(
        this,
        `BrandProductsResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      brand_users: new BrandUsersResource(
        this,
        `BrandUsersResource-${props.environment}`,
        {
          layers: props.layers,
          environment: props.environment,
          cognito_construct: props.cognito_construct,
          cognito_authorizer: props.brand_cognito_authorizer,
          rest_api: props.rest_api,
        },
      ),

      mrfs: new MrfsResource(this, `MrfsResource-${props.environment}`, {
        environment: props.environment,
        rest_api: props.rest_api,
      }),

      verification: new VerificationResource(
        this,
        `VerificationResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      users: new UsersResource(this, `UsersResource-${props.environment}`, {
        cognito_authorizer: props.brand_cognito_authorizer,
        environment: props.environment,
        dynamodb_construct: props.dynamodb_construct,
        rest_api: props.rest_api,
      }),

      gs1_checker: new GS1CheckerResource(
        this,
        `GS1CheckerResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          secret: props.secret,
          rest_api: props.rest_api,
        },
      ),

      landing_page_templates: new LandingPageTemplatesResource(
        this,
        `LandingPageTemplatesResource-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      image_library: new ImageLibraryResource(
        this,
        `ImageLibraryResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          buckets_construct: props.buckets_construct,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      invite: new InviteResource(this, `InviteResource-${props.environment}`, {
        cognito_authorizer: props.brand_cognito_authorizer,
        dynamodb_construct: props.dynamodb_construct,
        environment: props.environment,
        rest_api: props.rest_api,
      }),

      landing_pages_preview: new LandingPagesPreviewResource(
        this,
        `LandingPagesPreviewResource-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      batch_upload: new BatchUploadResource(
        this,
        `BatchUploadResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      batch_upload_product_groups: new BatchUploadProductGroupsResource(
        this,
        `BatchUploadResourceProductsGroups-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      campaign_events: new CampaignEventsResource(
        this,
        `CampaignEventResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      forgot_password: new ForgotPasswordResource(
        this,
        `ForgotPasswordResource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      populate_cron_settings: new PopulateCronSettingsResource(
        this,
        `PopulateCronSettingsResource-${props.environment}`,
        {
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      user_attributes: new UserAttributesResource(
        this,
        `UserAttributesResource-${props.environment}`,
        {
          cognito_authorizer: props.brand_cognito_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      test_data: new TestDataResource(
        this,
        `TestDataResource-${props.environment}`,
        {
          environment: props.environment,
          buckets_construct: props.buckets_construct,
          cognito_construct: props.cognito_construct,
          dynamodb_construct: props.dynamodb_construct,
          sqs_construct: props.sqs_construct,
          rest_api: props.rest_api,
        },
      ),
    };
  }
}
