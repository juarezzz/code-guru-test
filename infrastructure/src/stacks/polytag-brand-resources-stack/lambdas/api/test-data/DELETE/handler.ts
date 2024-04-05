/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { DeleteRequest } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { chunk } from 'lodash';
import {
  DeleteTableCommand,
  DeleteTableCommandInput,
} from '@aws-sdk/client-timestream-write';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { get_all_brands } from '_modules/brands/functions/get/get-all-brands';
import { delete_folder } from '_modules/image-library/functions/delete/delete-folder';
import { delete_cognito_mrf_user } from '_modules/users/functions/delete/delete-cognito-mrf-user';
import { delete_cognito_brand_user } from '_modules/users/functions/delete/delete-cognito-brand-user';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { timestream_client_write } from '_clients/timestream';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

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

      const { brands: brands_list } = await get_all_brands({});

      const delete_brand_promises: Promise<void>[] = brands_list
        .filter(({ brand_name }) => brand_name.includes('Brand'))
        .map(current_brand => {
          const brand_id = current_brand.partition_key.replace('brand#', '');

          return delete_folder({ brand_id });
        });

      await Promise.all(delete_brand_promises);

      /* ----------
       *  Remove Dynamo objects
       * ---------- */

      const brands_promises = brands_list
        .filter(({ brand_name }) => brand_name.includes('Brand'))
        .map(brand => {
          const params: QueryCommandInput = {
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: '#pk = :pk',
            ExpressionAttributeNames: {
              '#pk': 'partition_key',
            },
            ExpressionAttributeValues: {
              ':pk': brand.partition_key,
            },
          };

          const command = new QueryCommand(params);

          return dynamodb_documentclient.send(command);
        });

      const brands_promises_response = await Promise.all(brands_promises);

      const total_brands = brands_promises_response.flatMap(
        brand => brand.Items,
      );

      console.log(`Removing ${total_brands.length} items from DynamoDB`);

      const deletes: { DeleteRequest: DeleteRequest }[] = total_brands.map(
        Item => ({
          DeleteRequest: {
            Key: {
              partition_key: Item?.partition_key,
              sort_key: Item?.sort_key,
            },
          },
        }),
      );

      const table_name = process.env.TABLE_NAME || '';

      await Promise.all(
        chunk(deletes, 25).map(batch => {
          const params: BatchWriteCommandInput = {
            RequestItems: {
              [table_name]: [...batch],
            },
          };

          const command = new BatchWriteCommand(params);
          return dynamodb_documentclient.send(command);
        }),
      );

      const third_party_params: QueryCommandInput = {
        TableName: `MainTable-${process.env.ENVIRONMENT}`,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'partition_key',
        },
        ExpressionAttributeValues: {
          ':pk': 'third-party#brand-e2e',
        },
      };

      const third_party_command = new QueryCommand(third_party_params);

      const printer_params: QueryCommandInput = {
        TableName: `MainTable-${process.env.ENVIRONMENT}`,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'partition_key',
        },
        ExpressionAttributeValues: {
          ':pk': 'printer#brand-e2e',
        },
      };

      const printer_command = new QueryCommand(printer_params);

      const admin_landing_page: QueryCommandInput = {
        TableName: `MainTable-${process.env.ENVIRONMENT}`,
        KeyConditionExpression: '#pk = :pk',
        ExpressionAttributeNames: {
          '#pk': 'partition_key',
        },
        FilterExpression: 'contains(created_by, :created_by)',
        ExpressionAttributeValues: {
          ':pk': 'admin',
          ':created_by': 'brand-e2e',
        },
      };

      const admin_landing_page_command = new QueryCommand(admin_landing_page);

      const promises: Promise<QueryCommandOutput>[] = [
        dynamodb_documentclient.send(third_party_command),
        dynamodb_documentclient.send(printer_command),
        dynamodb_documentclient.send(admin_landing_page_command),
      ];

      const promise_response = await Promise.all(promises);

      const total_response = promise_response.flatMap(brand => brand.Items);

      const deletes_promises: { DeleteRequest: DeleteRequest }[] =
        total_response.map(Item => ({
          DeleteRequest: {
            Key: {
              partition_key: Item?.partition_key,
              sort_key: Item?.sort_key,
            },
          },
        }));

      await Promise.all(
        chunk(deletes_promises, 25).map(batch => {
          const params: BatchWriteCommandInput = {
            RequestItems: {
              [table_name]: [...batch],
            },
          };

          const command = new BatchWriteCommand(params);
          return dynamodb_documentclient.send(command);
        }),
      );

      console.log('DynamoDB cleaned successfully!');

      /* ----------
       *  Remove Cognito objects
       * ---------- */

      const cognito_user_promises = [
        delete_cognito_brand_user('user@brand-e2e.com'),
        delete_cognito_brand_user('brand-test@gmail.com'),
        delete_cognito_brand_user('main@brand-e2e.com'),

        delete_cognito_mrf_user('mrf-user@brand-e2e.com'),
      ];

      await Promise.allSettled(cognito_user_promises);

      console.log(`Users removed successfully!`);

      /* ----------
       *  Remove Timestream objects
       * ---------- */

      const delete_table_params: DeleteTableCommandInput = {
        DatabaseName: process.env.TIMESTREAM_NAME,
        TableName: process.env.TIMESTREAM_NAME,
      };

      const delete_table_command = new DeleteTableCommand(delete_table_params);
      await timestream_client_write.send(delete_table_command);

      console.log('Timestream cleaned successfully.');

      return http_response({
        body: { message: 'Brands cleared' },
        status_code: 200,
      });
    } catch (error) {
      console.log('Error at DELETE /test-data');
      console.log(error);

      return handle_http_error_response({ error });
    }
  };
