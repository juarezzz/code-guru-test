/* ---------- External ---------- */
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient as dynamodb } from '_clients/dynamodb';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_brand } from '_modules/brands/functions/create/create-brand';
import { create_printer_user } from '_modules/users/functions/create/create-printer-user';
import { create_printer_user_invite } from '_modules/users/functions/create/create-printer-user-invite';

const credentials = {
  email: 'user@printer-e2e.com',
  password: 'Printer@123',
  printer_id: 'printer-e2e',
};

const BRAND_GTIN = '7896005211168';

export const handler: APIGatewayProxyHandlerV2 = async () => {
  console.error('Running: POST /printer-test-data');

  try {
    if (process.env.ENVIRONMENT !== 'TEST') {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['forbidden-endpoint-environment'].code,
          message: error_messages['forbidden-endpoint-environment'].message,
        }),
      );
    }

    await create_printer_user_invite({
      email: 'main@printer-e2e.com',
      printer_id: credentials.printer_id,
      sub: 'test-pipeline',
    });

    /* ----------
     * Creating a user in Cognito Printer Userpool for the tests
     * ---------- */

    const { printer_user: user } = await create_printer_user({
      ...credentials,
      created_by: 'test-pipeline',
    });

    const test_printer_user_command = new AdminConfirmSignUpCommand({
      Username: user.sort_key.split('#')[1],
      UserPoolId: process.env.PRINTER_COGNITO_USERPOOL_ID,
    });

    const update_test_printer_user_command =
      new AdminUpdateUserAttributesCommand({
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        Username: user.sort_key.split('#')[1],
        UserPoolId: process.env.PRINTER_COGNITO_USERPOOL_ID,
      });

    await cognito_client.send(test_printer_user_command);
    await cognito_client.send(update_test_printer_user_command);

    /* ----------
     * Creating a Brand user for the tests
     * ---------- */

    const { brand } = await create_brand({
      brand_name: 'Printer Test Company',
      gs1_territory: 'GS1 Brasil',
      industry: 'Local Authority',
      organisation_size: 'Tier 1 (<£5m)',
      sub: '15978942365',
      pk: `brand#${credentials.printer_id}`,
    });

    const brand_product = {
      partition_key: brand.partition_key,
      sort_key: `brand-product#${BRAND_GTIN}`,
      attributes: [],
      components: [],
      created_at: new Date().getTime(),
      created_by: user.sort_key.split('#')[1],
      datatype: 'brand-product',
      gtin: BRAND_GTIN,
      product_group_name: 'Milk',
      product_group_sort_key:
        'brand-product-group#3a0130c1-c847-4877-bb13-6f59f89616a7',
      product_name: 'Milk',
      search: 'brand-product#milk',
      updated_at: new Date().getTime(),
    };

    const brand_product_params: PutCommandInput = {
      TableName: process.env.TABLE_NAME,
      Item: brand_product,
    };

    const brand_product_command = new PutCommand(brand_product_params);

    await dynamodb.send(brand_product_command);

    /* ----------
     * Creating Printer for the tests
     * ---------- */

    const printer = {
      partition_key: `printer#${credentials.printer_id}`,
      sort_key: 'printer',
      created_at: new Date().getTime(),
      created_by: user.sort_key.split('#')[1],
      datatype: 'printer',
      printer_name: 'TEST_Printer',
      search: 'printer-name#test_printer',
      updated_at: new Date().getTime(),
    };

    const printer_params: PutCommandInput = {
      TableName: process.env.TABLE_NAME,
      Item: printer,
    };

    const printer_command = new PutCommand(printer_params);

    await dynamodb.send(printer_command);

    /* ----------
     * Creating Printer Customer for the tests
     * ---------- */

    const printer_customer = {
      partition_key: `printer#${credentials.printer_id}`,
      sort_key: `printer-customer#${credentials.printer_id}`,
      brand_name: brand.brand_name,
      created_at: new Date().getTime(),
      datatype: 'printer-customer',
      updated_at: new Date().getTime(),
    };

    const printer_customer_params: PutCommandInput = {
      TableName: process.env.TABLE_NAME,
      Item: printer_customer,
    };

    const printer_customer_command = new PutCommand(printer_customer_params);

    await dynamodb.send(printer_customer_command);

    /* ----------
     * Creating Printer user for the tests
     * ---------- */

    const printer_user = {
      partition_key: `printer#${credentials.printer_id}`,
      sort_key: 'printer-user#adc94fa6-365c-4ab2-9490-f7434f7f1bee',
      created_at: new Date().getTime(),
      datatype: 'printer-user',
      email: credentials.email,
      last_login: new Date().getTime(),
      updated_at: new Date().getTime(),
    };

    const printer_user_params: PutCommandInput = {
      TableName: process.env.TABLE_NAME,
      Item: printer_user,
    };

    const printer_user_command = new PutCommand(printer_user_params);

    await dynamodb.send(printer_user_command);

    return http_response({
      body: { message: 'Printer Test environment setup.' },
      status_code: 200,
    });
  } catch (error) {
    console.log('Error at POST /printer-test-data');
    console.log(error);

    return handle_http_error_response({ error });
  }
};
