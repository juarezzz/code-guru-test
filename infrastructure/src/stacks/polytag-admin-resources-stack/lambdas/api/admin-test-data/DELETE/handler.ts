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
} from '@aws-sdk/lib-dynamodb';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { delete_cognito_admin_user } from '_modules/users/functions/delete/delete-cognito-admin-user';
import { delete_cognito_brand_user } from '_modules/users/functions/delete/delete-cognito-brand-user';
import { delete_cognito_third_party_user } from '_modules/users/functions/delete/delete-cognito-third-party-user';
import { delete_cognito_printer_user } from '_modules/users/functions/delete/delete-cognito-printer-user';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

const ADMIN_TEST_DOMAIN = 'admin-e2e';

const datatype_name: Record<string, string> = {
  printer: 'printer_name',
  mrf: 'mrf_name',
  'third-party': 'third_party_name',
};

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

      const datatypes = ['printer', 'mrf', 'third-party'];

      const datatypes_promises = datatypes.map(datatype => {
        const params: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
          IndexName: 'datatype-index',
          KeyConditionExpression: 'datatype = :datatype',
          FilterExpression: `contains(${datatype_name[datatype]}, :suffix)`,
          ExpressionAttributeValues: {
            ':datatype': datatype,
            ':suffix': 'Admin',
          },
        };

        const command = new QueryCommand(params);

        return dynamodb_documentclient.send(command);
      });

      const datatypes_queries = await Promise.all(datatypes_promises);

      const primary_keys = [
        'third-party#admin-e2e',
        'printer#admin-e2e',
        'brand#admin-e2e',
      ];

      const primary_keys_promises = primary_keys.map(partition_key => {
        const params: QueryCommandInput = {
          TableName: process.env.TABLE_NAME,
          KeyConditionExpression: 'partition_key = :partition_key',
          ExpressionAttributeValues: {
            ':partition_key': partition_key,
          },
        };

        const command = new QueryCommand(params);

        return dynamodb_documentclient.send(command);
      });

      const primary_keys_queries = await Promise.all(primary_keys_promises);

      // ----- Delete TEST Dynamo objects ----- //

      const param: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'partition_key = :partition_key',
        FilterExpression: 'contains(email, :email)',
        ExpressionAttributeValues: {
          ':partition_key': 'admin',
          ':email': ADMIN_TEST_DOMAIN,
        },
      };

      const query_command = new QueryCommand(param);

      const { Items } = await dynamodb_documentclient.send(query_command);

      const all_items = datatypes_queries
        .map(item => item.Items)
        .flat()
        .concat(Items || [])
        .concat(primary_keys_queries.map(item => item.Items).flat());

      if (all_items.length) {
        const deletes: { DeleteRequest: DeleteRequest }[] = all_items.map(
          Item => ({
            DeleteRequest: {
              Key: {
                partition_key: Item?.partition_key,
                sort_key: Item?.sort_key,
              },
            },
          }),
        );

        console.log(`Removing ${deletes.length} items from DynamoDB.`);

        const remove_params: BatchWriteCommandInput = {
          RequestItems: {
            [`MainTable-${process.env.ENVIRONMENT}`]: [...deletes],
          },
        };
        const command = new BatchWriteCommand(remove_params);
        await dynamodb_documentclient.send(command);

        console.log('DynamoDB cleaned successfully.');
      }

      // ----- Delete TEST Admin Cognito users ----- //

      const cognito_user_promises = [
        delete_cognito_admin_user('main@admin-e2e.com'),
        delete_cognito_admin_user('admin_user@admin-e2e.com'),

        delete_cognito_brand_user('brand_user@admin-e2e.com'),

        delete_cognito_third_party_user('mock_third_party@admin-e2e.com'),

        delete_cognito_printer_user('mock_printer@admin-e2e.com'),
      ];

      await Promise.allSettled(cognito_user_promises);

      console.log('Cognito cleaned successfully.');

      return http_response({
        body: { message: 'Admin Test environment cleared' },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at DELETE /admin-test-data');
      console.error(error);

      return handle_http_error_response({ error });
    }
  };
