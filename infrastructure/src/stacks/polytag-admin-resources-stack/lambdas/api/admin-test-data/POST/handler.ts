/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  AdminAddUserToGroupCommand,
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_polytag_admin_invite } from '_modules/users/functions/create/create-polytag-admin-invite';
import { create_brand } from '_modules/brands/functions/create/create-brand';
import { create_polytag_brand_invite } from '_modules/users/functions/create/create-polytag-brand-invite';
import { create_brand_domain } from '_modules/brand-domains/functions/create/create-brand-domain';
import { create_brand_user } from '_modules/users/functions/create/create-brand-user';
import { create_third_party } from '_modules/third-party/functions/create/create-third-party';
import { create_third_party_user } from '_modules/users/functions/create/create-third-party-user';
import { create_printer } from '_modules/printer/functions/create/create-printer';
import { create_printer_user } from '_modules/users/functions/create/create-printer-user';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { cognito_client } from '_clients/cognito';

const TEST_USER_EMAIL = 'main@admin-e2e.com';
const PK_SUFFIX = 'admin-e2e';

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

      // ----- Invite TEST Admin user as Super Admin ----- //

      await create_polytag_admin_invite({
        email: TEST_USER_EMAIL,
        cognito_group: 'polytag-super-admin',
        sub: 'test-pipeline',
      });

      // ----- Create TEST Polytag Brand User ----- //

      const brand_user_credentials = {
        name: 'Brand Doe',
        email: 'brand_user@admin-e2e.com',
        password: 'Brand@123',
        role: 'Tester',
      };

      const brand_user_create_command = new SignUpCommand({
        ClientId: process.env.BRAND_COGNITO_CLIENT_ID,
        Password: brand_user_credentials.password,
        Username: brand_user_credentials.email,
        UserAttributes: [
          { Name: 'custom:full_name', Value: brand_user_credentials.name },
          { Name: 'custom:job_title', Value: brand_user_credentials.role },
        ],
      });

      const brand_user_info = await cognito_client.send(
        brand_user_create_command,
      );

      const add_brand_user_to_group_command = new AdminAddUserToGroupCommand({
        GroupName: 'brand-admin',
        Username: brand_user_info.UserSub,
        UserPoolId: process.env.BRAND_COGNITO_USERPOOL_ID,
      });

      const confirm_brand_user_command = new AdminConfirmSignUpCommand({
        Username: brand_user_info.UserSub,
        UserPoolId: process.env.BRAND_COGNITO_USERPOOL_ID,
      });

      // ----- Create TEST Create Brand in Dynamo ----- //

      const { brand: existing_brand_info } = await create_brand({
        brand_name: 'Admin Test',
        gs1_territory: 'GS1 Brasil',
        industry: 'Local Authority',
        organisation_size: 'Tier 1 (<£5m)',
        sub: brand_user_info?.UserSub || '',
        pk: `brand#${PK_SUFFIX}`,
      });

      const existing_brand_id = existing_brand_info.partition_key.replace(
        'brand#',
        '',
      );

      const updated_brand_user_info_command =
        new AdminUpdateUserAttributesCommand({
          UserAttributes: [
            { Name: 'custom:brand_id', Value: existing_brand_id },
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
          Username: brand_user_info.UserSub,
          UserPoolId: process.env.BRAND_COGNITO_USERPOOL_ID,
        });

      const brand_promises: Promise<unknown>[] = [
        create_brand_user({
          brand_id: existing_brand_id,
          sub: brand_user_info?.UserSub || '',
        }),

        create_polytag_brand_invite({
          email: 'brand_user@admin-e2e.com',
          sub: 'test-pipeline',
        }),

        create_brand_domain({
          domain: 'admin-e2e.com',
          status: 'Admin Domain',
          brand_id: existing_brand_id,
        }),

        cognito_client.send(add_brand_user_to_group_command),

        cognito_client.send(confirm_brand_user_command),

        cognito_client.send(updated_brand_user_info_command),
      ];

      await Promise.all(brand_promises);

      // ----- Create TEST Create Third party in Dynamo ----- //

      const mock_third_party = await create_third_party({
        sub: 'test-pipeline',
        third_party_name: 'Mock Third Party',
        partition_key: `third-party#${uuidv4()}`,
      });

      const { third_party_user } = await create_third_party_user({
        created_by: 'test-pipeline',
        email: 'mock_third_party@admin-e2e.com',
        password: 'Password@123',
        third_party_groups: ['third-party-labels'],
        third_party_id: mock_third_party.partition_key.split('#')[1],
      });

      const signup_third_party_user = new AdminConfirmSignUpCommand({
        Username: third_party_user.sort_key.split('#')[1],
        UserPoolId: process.env.THIRD_PARTY_COGNITO_USERPOOL_ID,
      });

      const verify_email_third__party_user =
        new AdminUpdateUserAttributesCommand({
          UserAttributes: [
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
          Username: third_party_user.sort_key.split('#')[1],
          UserPoolId: process.env.THIRD_PARTY_COGNITO_USERPOOL_ID,
        });

      // ----- Create TEST Create Printer in Dynamo ----- //

      const { printer: mock_printer } = await create_printer({
        printer_name: 'Mock Printer',
        sub: 'test-pipeline',
        partition_key: `printer#${uuidv4()}`,
      });

      const { printer_user } = await create_printer_user({
        created_by: 'test-pipeline',
        email: 'mock_printer@admin-e2e.com',
        password: 'Password@123',
        printer_id: mock_printer.partition_key.split('#')[1],
      });

      const signup_printer_user = new AdminConfirmSignUpCommand({
        Username: printer_user.sort_key.split('#')[1],
        UserPoolId: process.env.PRINTER_COGNITO_USERPOOL_ID,
      });

      const verify_email_printer_user = new AdminUpdateUserAttributesCommand({
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        Username: printer_user.sort_key.split('#')[1],
        UserPoolId: process.env.PRINTER_COGNITO_USERPOOL_ID,
      });

      const test_user_promises: Promise<unknown>[] = [
        cognito_client.send(signup_third_party_user),
        cognito_client.send(verify_email_third__party_user),
        cognito_client.send(signup_printer_user),
        cognito_client.send(verify_email_printer_user),
      ];

      await Promise.all(test_user_promises);

      // ----- Create TEST Polytag Admin User ----- //

      const admin_user_credentials = {
        name: 'Admin Doe',
        email: 'admin_user@admin-e2e.com',
        password: 'Admin@123',
      };

      const admin_user_create_command = new SignUpCommand({
        ClientId: process.env.ADMIN_COGNITO_CLIENT_ID,
        Password: admin_user_credentials.password,
        Username: admin_user_credentials.email,
        UserAttributes: [
          { Name: 'custom:full_name', Value: admin_user_credentials.name },
        ],
      });

      const admin_user_info = await cognito_client.send(
        admin_user_create_command,
      );

      const add_admin_user_to_group_command = new AdminAddUserToGroupCommand({
        GroupName: 'polytag-admin',
        UserPoolId: process.env.ADMIN_COGNITO_USERPOOL_ID,
        Username: admin_user_info.UserSub,
      });

      const confirm_admin_user_command = new AdminConfirmSignUpCommand({
        Username: admin_user_info.UserSub,
        UserPoolId: process.env.ADMIN_COGNITO_USERPOOL_ID,
      });

      // ----- Create TEST Admin user in Dynamo ----- //

      const admin_user = {
        created_at: new Date().getTime(),
        datatype: 'admin-user',
        partition_key: `admin`,
        sort_key: `admin-user#${admin_user_info.UserSub}`,
        updated_at: new Date().getTime(),
        cognito_group: 'polytag-admin',
        last_login: new Date().getTime(),
        full_name: admin_user_credentials.name,
        email: admin_user_credentials.email,
      };

      const params: PutCommandInput = {
        TableName: process.env.TABLE_NAME,
        Item: admin_user,
      };

      const command = new PutCommand(params);

      await dynamodb_documentclient.send(command);

      const updated_admin_user_info_command =
        new AdminUpdateUserAttributesCommand({
          UserAttributes: [
            {
              Name: 'email_verified',
              Value: 'true',
            },
          ],
          Username: admin_user_info.UserSub,
          UserPoolId: process.env.ADMIN_COGNITO_USERPOOL_ID,
        });

      const admin_promises: Promise<unknown>[] = [
        cognito_client.send(updated_admin_user_info_command),

        cognito_client.send(add_admin_user_to_group_command),

        cognito_client.send(confirm_admin_user_command),
      ];

      await Promise.all(admin_promises);

      return http_response({
        body: { Message: 'Ok' },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at POST /admin-test-data');
      console.log(error);

      return handle_http_error_response({ error });
    }
  };
