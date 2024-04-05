/* ---------- External ---------- */
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
  CreateDatabaseCommand,
  CreateDatabaseCommandInput,
  CreateTableCommand,
  CreateTableCommandInput,
  ListDatabasesCommand,
  WriteRecordsCommandInput,
  MeasureValueType,
  TimeUnit,
  _Record,
  WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write';
import { AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';
import _ from 'lodash';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Modules ---------- */
import { create_mrf_user } from '_modules/users/functions/create/create-mrf-user';
import { create_mrf_user_invite } from '_modules/users/functions/create/create-mrf-user-invite';
import { create_mrf } from '_modules/mrfs/functions/create/create-mrf';
import { create_brand } from '_modules/brands/functions/create/create-brand';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';
import { timestream_client_write } from '_clients/timestream';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

const PK_SUFFIX = 'mrf-e2e';
const GTIN = '7896005210697';

export const handler: APIGatewayProxyHandlerV2 = async () => {
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
     * Creating a Brand for the tests
     * ---------- */

    const { brand: mrf_brand } = await create_brand({
      brand_name: 'MRF Comp Company',
      gs1_territory: 'GS1 Brasil',
      industry: 'Local Authority',
      organisation_size: 'Tier 1 (<£5m)',
      sub: '15978942365',
      pk: `brand#${PK_SUFFIX}`,
    });

    const brand_product = {
      partition_key: mrf_brand.partition_key,
      sort_key: `brand-product#${GTIN}`,
      attributes: [],
      components: [],
      created_at: new Date().getTime(),
      created_by: 'mrf-e2e',
      datatype: 'brand-product',
      gtin: GTIN,
      product_group_name: 'Emref',
      product_group_sort_key:
        'brand-product-group#3a0130c1-c847-4877-bb13-6f59f89616a7',
      product_name: 'Emref',
      search: 'brand-product#emref',
      updated_at: new Date().getTime(),
    };

    const brand_product_params: PutCommandInput = {
      TableName: process.env.TABLE_NAME,
      Item: brand_product,
    };

    const brand_product_command = new PutCommand(brand_product_params);

    await dynamodb_documentclient.send(brand_product_command);

    const mrf = await create_mrf({
      mrf_name: 'Recovery e2e Test',
      latitude: 11,
      longitude: 22,
      sub: PK_SUFFIX,
      pk: `mrf#${PK_SUFFIX}`,
    });

    await create_mrf_user_invite({
      email: 'user@mrf-e2e.com',
      mrf_id: PK_SUFFIX,
      sub: mrf.created_by,
      role: 'mrf-admin',
    });

    const { mrf_user } = await create_mrf_user({
      email: 'user@mrf-e2e.com',
      mrf_id: PK_SUFFIX,
      password: 'Password@123',
      role: 'mrf-admin',
    });

    const confirm_user_mrf_user = new AdminConfirmSignUpCommand({
      Username: mrf_user.sort_key.split('#')[1],
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    cognito_client.send(confirm_user_mrf_user);

    await create_mrf_user_invite({
      email: 'main@mrf-e2e.com',
      mrf_id: PK_SUFFIX,
      sub: mrf.created_by,
      role: 'mrf-admin',
    });

    // ----- Create TEST Timestream table ----- //

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

    // Add metrics to Timestream

    const new_records: _Record[] = Array(1)
      .fill({})
      .map(() => {
        return {
          Dimensions: [
            { Name: 'mrf_id', Value: PK_SUFFIX },
            { Name: 'data_type', Value: 'mrf_scans' },
            { Name: 'gtin', Value: GTIN },
            { Name: 'originated_from', Value: 'cron_job' },
          ],
          MeasureName: 'uv-scans',
          MeasureValueType: MeasureValueType.BIGINT,
          MeasureValue: '1',
          Time: Date.now().toString(),
          TimeUnit: TimeUnit.MILLISECONDS,
        };
      });

    /* ----------
     * Inserts the new records in batches
     * ---------- */

    const records_batches = _.chunk(new_records, 25);

    for (const batch of records_batches) {
      const insert_params: WriteRecordsCommandInput = {
        DatabaseName: process.env.TIMESTREAM_NAME,
        TableName: process.env.TIMESTREAM_NAME,
        Records: batch,
      };

      const insert_command = new WriteRecordsCommand(insert_params);

      await timestream_client_write.send(insert_command);
    }

    return http_response({
      body: { message: 'Mrf Test environment setup.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /mrf-test-data');
    console.log(error);

    return handle_http_error_response({ error });
  }
};
