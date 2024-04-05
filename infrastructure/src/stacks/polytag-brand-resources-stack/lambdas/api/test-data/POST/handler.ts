/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  SignUpCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  AdminConfirmSignUpCommand,
  SignUpCommandInput,
  InitiateAuthRequest,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { chunk } from 'lodash';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import {
  CreateDatabaseCommand,
  CreateDatabaseCommandInput,
  CreateTableCommand,
  CreateTableCommandInput,
  ListDatabasesCommand,
} from '@aws-sdk/client-timestream-write';
import { add, format } from 'date-fns';
import axios from 'axios';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { timestream_client_write } from '_clients/timestream';
import { sqs_client } from '_clients/sqs';

/* ---------- Modules ---------- */
import { create_brand } from '_modules/brands/functions/create/create-brand';
import { create_brand_user } from '_modules/users/functions/create/create-brand-user';
import { create_brand_domain } from '_modules/brand-domains/functions/create/create-brand-domain';
import { create_polytag_brand_invite } from '_modules/users/functions/create/create-polytag-brand-invite';
import { create_labels_request } from '_modules/label/functions/create/create-labels-request';
import { create_product_group } from '_modules/product-groups/functions/create/create-product-group';
import { create_product } from '_modules/products/functions/create/create-product';
import { create_campaign } from '_modules/campaigns/functions/create/create-campaign';
import { create_landing_page_template } from '_modules/landing-page-templates/functions/create/create-landing-page-template';
import { create_landing_page } from '_modules/landing-pages/functions/create/create-landing-page';
import { create_third_party_redeem_log } from '_modules/third-party/functions/create/create-third-party-redeem-log';
import { create_third_party } from '_modules/third-party/functions/create/create-third-party';
import { create_third_party_confirm_log } from '_modules/third-party/functions/create/create-third-party-confirm-log';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { LANDING_PAGE } from '_constants/test/landing_page_template';
import {
  TEST_BRAND_GTIN,
  BRAND_ID,
  MRF_USER,
  TEST_USER,
  products,
} from '_constants/test/brand_setup';

const now = new Date();

const start_date = format(now, 'yyyy-MM-dd');
const end_date = format(add(now, { days: 7 }), 'yyyy-MM-dd');

export const handler: APIGatewayProxyHandlerV2 =
  async (): Promise<APIGatewayProxyStructuredResultV2> => {
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

      /* ----------
       *  Create TEST Timestream table
       * ---------- */

      const list_databases_command = new ListDatabasesCommand({});

      const { Databases: timestream_databases } =
        await timestream_client_write.send(list_databases_command);

      if (
        timestream_databases?.length &&
        !timestream_databases.some(
          database => database.DatabaseName === process.env.TIMESTREAM_NAME,
        )
      ) {
        const create_database_params: CreateDatabaseCommandInput = {
          DatabaseName: process.env.TIMESTREAM_NAME,
        };

        const create_database_command = new CreateDatabaseCommand(
          create_database_params,
        );

        await timestream_client_write.send(create_database_command);
      }

      const create_table_params: CreateTableCommandInput = {
        DatabaseName: process.env.TIMESTREAM_NAME,
        TableName: process.env.TIMESTREAM_NAME,
        MagneticStoreWriteProperties: {
          EnableMagneticStoreWrites: true,
        },
        RetentionProperties: {
          MagneticStoreRetentionPeriodInDays: 10 * 365,
          MemoryStoreRetentionPeriodInHours: 24,
        },
      };

      const create_table_command = new CreateTableCommand(create_table_params);

      await timestream_client_write.send(create_table_command);

      /* ----------
       * Creating a Test user in cognito
       * ---------- */

      const test_user_command = new SignUpCommand({
        ClientId: process.env.COGNITO_CLIENT_ID,
        Password: TEST_USER.password,
        Username: TEST_USER.email,
        UserAttributes: [
          { Name: 'custom:full_name', Value: TEST_USER.full_name },
          { Name: 'custom:job_title', Value: TEST_USER.job_title },
        ],
      });

      const test_user = await cognito_client.send(test_user_command);

      /* ----------
       * Creating an "existing" brand associated to the user
       * ---------- */

      const { brand: test_brand_info } = await create_brand({
        brand_name: TEST_USER.brand_name,
        gs1_territory: 'GS1 Brasil',
        industry: 'Local Authority',
        organisation_size: 'Tier 1 (<£5m)',
        sub: test_user?.UserSub || '',
        pk: `brand#${BRAND_ID}`,
      });

      /* ----------
       * Adding the brand ID to the user attributes,
       * veryfing the newly created existing user,
       * adding them to the brand admins groups and
       * whitelisting both existing and test users
       * ---------- */

      const group_test_user_command = new AdminAddUserToGroupCommand({
        GroupName: 'brand-admin',
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
        Username: test_user.UserSub,
      });

      const confirm_test_user_command = new AdminConfirmSignUpCommand({
        Username: test_user.UserSub,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
      });

      const update_test_user_command = new AdminUpdateUserAttributesCommand({
        UserAttributes: [
          { Name: 'custom:brand_id', Value: BRAND_ID },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        Username: test_user.UserSub,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
      });

      const promises: Promise<unknown>[] = [
        create_brand_user({
          brand_id: BRAND_ID,
          sub: test_user?.UserSub || '',
          steps: [
            'create_brand',
            'create_landing_page',
            'upload_products',
            'create_campaign',
            'invite_colleagues',
          ],
          role: 'brand-admin',
          email: TEST_USER.email,
          full_name: TEST_USER.full_name,
          job_title: TEST_USER.job_title,
        }),

        create_polytag_brand_invite({
          email: TEST_USER.email,
          sub: 'test-pipeline',
        }),

        create_polytag_brand_invite({
          email: 'brand-test@gmail.com',
          sub: 'test-pipeline',
        }),

        create_polytag_brand_invite({
          email: 'main@brand-e2e.com',
          sub: 'test-pipeline',
        }),

        create_brand_domain({
          domain: 'brand-e2e.com',
          status: 'ACTIVE',
          brand_id: BRAND_ID,
        }),

        cognito_client.send(group_test_user_command),

        cognito_client.send(confirm_test_user_command),

        cognito_client.send(update_test_user_command),
      ];

      await Promise.all(promises);

      /* ----------
       * Analytics section setup for QR tags printed
       * ---------- */

      const test_product_group = await create_product_group({
        brand_id: BRAND_ID,
        owner_name: TEST_USER.full_name,
        owner_sub: test_user?.UserSub || '',
        product_group_name: 'VITAPOWER',
      });

      const products_promises = products.map(
        ({ product_name, gtin, attributes, components }) => {
          return create_product({
            brand_id: BRAND_ID,
            created_by: test_brand_info.sort_key.split('#')[1],
            product_group_sort_key: test_product_group.sort_key,
            product_input: {
              product_group_name: test_product_group.product_group_name,
              gtin,
              product_name,
              product_description: '',
              attributes,
              components,
            },
          });
        },
      );

      await Promise.all(products_promises);

      const { landing_page_template } = await create_landing_page_template({
        landing_page_template_name: 'Main Test Landing Page',
        created_by: 'brand-e2e',
        components: JSON.stringify(LANDING_PAGE.components),
        global_styles: JSON.stringify(LANDING_PAGE.styles),
      });

      const { landing_page } = await create_landing_page({
        brand_id: BRAND_ID,
        components: landing_page_template.components,
        global_styles: landing_page_template.global_styles,
        landing_page_name: landing_page_template.landing_page_template_name,
        user_id: 'brand-e2e',
      });

      await create_campaign({
        brand_id: BRAND_ID,
        owner_name: TEST_USER.full_name,
        campaign_name: 'Beta_Test',
        campaign_product_groups: [
          {
            product_group_count: 1,
            product_group_name: test_product_group.product_group_name,
            product_group_sort_key: test_product_group.sort_key,
          },
        ],
        campaign_landing_pages: [
          {
            start_date,
            end_date,
            landing_page_name: landing_page.landing_page_name,
            landing_page_sort_key: landing_page.sort_key,
          },
        ],
      });

      /* ----------
       * Create serialized codes
       * ---------- */

      for (const product_info of products) {
        const items_array = new Array(product_info.labels_printed).fill(0);

        const { labels_request } = await create_labels_request({
          sub: test_user?.UserSub || '',
          format: product_info.format,
          brand_id: BRAND_ID,
          gtin: product_info.gtin,
          reference: product_info.reference,
          printer_id: BRAND_ID,
          labels_amount: product_info.labels_printed,
          batches_count: Math.ceil(product_info.labels_printed / 200),
        });

        const request_id = labels_request.sort_key.split('#')[1];

        const items_batches = chunk(items_array, 200);

        for (const [
          batch_index,
          { length: amount },
        ] of items_batches.entries()) {
          const params: SendMessageCommandInput = {
            MessageBody: JSON.stringify({
              print_request: {
                sub: test_user?.UserSub || '',
                gtin: product_info.gtin,
                amount,
                brand_id: BRAND_ID,
                request_id,
                printer_id: BRAND_ID,
                batch_index,
              },
              command: 'create-confirmed',
            }),
            QueueUrl: process.env.QUEUE_URL,
            DelaySeconds: 0,
          };

          const command = new SendMessageCommand(params);

          await sqs_client.send(command);
        }

        console.log(
          `"Printer": User brand-e2e requested ${product_info.labels_printed} labels for ${TEST_BRAND_GTIN} - V2`,
        );
      }

      const test_third_party_user = await create_third_party({
        partition_key: `third-party#${BRAND_ID}`,
        sub: BRAND_ID,
        third_party_name: 'TEST',
      });

      await create_third_party_redeem_log({
        serial: 'qwerty1_1',
        third_party_id: test_third_party_user.partition_key.split('#')[1],
        gtin: String(products[0].gtin),
      });

      await create_third_party_confirm_log({
        serial: 'qwerty1_1',
        location: {
          city: 'Lima',
          country: 'Peru',
          latitude: -12.0432,
          longitude: -77.0282,
        },
        third_party_id: test_third_party_user.partition_key.split('#')[1],
        gtin: String(products[0].gtin),
      });

      /* ----------
       * Analytics section setup for Invisible tags
       * ---------- */

      const mrf_user_params: SignUpCommandInput = {
        ClientId: process.env.MRF_COGNITO_CLIENT_ID,
        Username: MRF_USER.email,
        Password: MRF_USER.password,
        UserAttributes: [
          { Name: 'custom:full_name', Value: '' },
          { Name: 'custom:mrf_id', Value: BRAND_ID },
        ],
      };

      const mrf_user_sign_up_command = new SignUpCommand(mrf_user_params);

      const { UserSub: mrf_user_sub } = await cognito_client.send(
        mrf_user_sign_up_command,
      );

      const group_mrf_user_command = new AdminAddUserToGroupCommand({
        GroupName: 'mrf-admin',
        UserPoolId: process.env.MRF_COGNITO_USERPOOL_ID,
        Username: mrf_user_sub,
      });

      const confirm_mrf_user_command = new AdminConfirmSignUpCommand({
        Username: mrf_user_sub,
        UserPoolId: process.env.MRF_COGNITO_USERPOOL_ID,
      });

      const update_mrf_user_command = new AdminUpdateUserAttributesCommand({
        UserAttributes: [
          { Name: 'custom:mrf_id', Value: BRAND_ID },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        Username: mrf_user_sub,
        UserPoolId: process.env.MRF_COGNITO_USERPOOL_ID,
      });

      const mrf_promises: Promise<unknown>[] = [
        cognito_client.send(group_mrf_user_command),
        cognito_client.send(confirm_mrf_user_command),
        cognito_client.send(update_mrf_user_command),
      ];

      await Promise.all(mrf_promises);

      const mrf_auth_params: InitiateAuthRequest = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: process.env.MRF_COGNITO_CLIENT_ID,
        AuthParameters: {
          USERNAME: MRF_USER.email,
          PASSWORD: MRF_USER.password,
        },
      };

      const mrf_auth_command = new InitiateAuthCommand(mrf_auth_params);

      const { AuthenticationResult: mrf_tokens } = await cognito_client.send(
        mrf_auth_command,
      );

      const data = [
        {
          gtin: products[0].gtin,
          count: 2500,
        },
      ];

      const mrf_ingest_request = await axios.post(
        `https://${process.env.API_DOMAIN_NAME}/mrf-ingest`,
        data,
        {
          headers: {
            Authorization: `Bearer ${mrf_tokens?.IdToken || ''}`,
            'Content-Type': 'application/json',
          },
        },
      );

      console.log('Response:', mrf_ingest_request.data);

      return http_response({
        body: { test_brand: test_brand_info },
        status_code: 200,
      });
    } catch (error) {
      console.log('Error at POST /test-data');
      console.log(error);

      return handle_http_error_response({ error });
    }
  };
