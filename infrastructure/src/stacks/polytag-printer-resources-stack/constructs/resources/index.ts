/* ---------- External ---------- */
import { CfnAuthorizer, IRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

/* ---------- Constructs ---------- */
import { CognitoConstruct } from '_stacks/backend-stack/constructs/Cognito';
import { LayersConstruct } from '_stacks/backend-stack/constructs/Layers';
import { SQSConstruct } from '_stacks/backend-stack/constructs/SQS';
import { BucketsConstruct } from '_stacks/backend-stack/constructs/Buckets';
import { DynamoDBConstruct } from '_stacks/backend-stack/constructs/DynamoDB';

/* ---------- Resources ---------- */
import { PrinterLabelsResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-labels';
import { PrinterAuthenticationResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-authentication';
import { PrinterForgotPasswordResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-forgot-password';
import { PrinterCustomersResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-customers';
import { PrinterCustomerProductsResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-customer-products';
import { PrinterSerialisedCodesResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-serialised-codes';
import { PrinterVerificationResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-verification';
import { PrinterTestDataConstruct } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-test-data';
import { PrinterUsersResource } from '_stacks/polytag-printer-resources-stack/constructs/resources/printer-users';

/* ---------- Interfaces ---------- */
interface Props {
  cognito_construct: CognitoConstruct;
  cognito_printer_authorizer: CfnAuthorizer;
  environment: string;
  layers_construct: LayersConstruct;
  sqs_construct: SQSConstruct;
  rest_api: IRestApi;
  dynamodb_construct: DynamoDBConstruct;
  buckets_construct: BucketsConstruct;
}

interface Resources {
  printer_labels: PrinterLabelsResource;
  printer_authentication: PrinterAuthenticationResource;
  printer_verification: PrinterVerificationResource;
  printer_forgot_password: PrinterForgotPasswordResource;
  printer_customers: PrinterCustomersResource;
  printer_customer_products: PrinterCustomerProductsResource;
  printer_serialised_codes: PrinterSerialisedCodesResource;
  printer_test_data: PrinterTestDataConstruct;
  printer_users: PrinterUsersResource;
}

export class ResourcesConstruct extends Construct {
  public readonly resources: Resources;

  constructor(scope: Construct, id: string, props: Props) {
    super(scope, id);

    this.resources = {
      printer_authentication: new PrinterAuthenticationResource(
        this,
        `Printer-Authentication-Resource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          layers_construct: props.layers_construct,
          rest_api: props.rest_api,
        },
      ),

      printer_verification: new PrinterVerificationResource(
        this,
        `Printer-Verification-Resource-${props.environment}`,
        {
          cognito_construct: props.cognito_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      printer_labels: new PrinterLabelsResource(
        this,
        `Printer-Labels-Resource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_printer_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
          sqs_construct: props.sqs_construct,
        },
      ),

      printer_forgot_password: new PrinterForgotPasswordResource(
        this,
        `Printer-ForgotPassword-Resource-${props.environment}`,
        {
          rest_api: props.rest_api,
          environment: props.environment,
          cognito_construct: props.cognito_construct,
        },
      ),

      printer_customers: new PrinterCustomersResource(
        this,
        `Printer-Customers-Resource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_printer_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
          layers_construct: props.layers_construct,
        },
      ),

      printer_customer_products: new PrinterCustomerProductsResource(
        this,
        `Printer-CustomerProducts-Resource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_printer_authorizer,
          environment: props.environment,
          rest_api: props.rest_api,
          layers_construct: props.layers_construct,
        },
      ),

      printer_serialised_codes: new PrinterSerialisedCodesResource(
        this,
        `Printer-SerialisedCodes-Resource-${props.environment}`,
        {
          rest_api: props.rest_api,
          environment: props.environment,
          sqs_construct: props.sqs_construct,
          layers_construct: props.layers_construct,
          cognito_authorizer: props.cognito_printer_authorizer,
        },
      ),

      printer_users: new PrinterUsersResource(
        this,
        `Printer-Users-Resource-${props.environment}`,
        {
          cognito_authorizer: props.cognito_printer_authorizer,
          dynamodb_construct: props.dynamodb_construct,
          environment: props.environment,
          rest_api: props.rest_api,
        },
      ),

      printer_test_data: new PrinterTestDataConstruct(
        this,
        `Printer-TestDataConstruct-Resource-${props.environment}`,
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
