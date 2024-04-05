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
import { chunk } from 'lodash';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { delete_cognito_printer_user } from '_modules/users/functions/delete/delete-cognito-printer-user';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

const PRINTER_TEST_DOMAIN = 'printer-e2e';

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

      // ----- Delete TEST Dynamo objects ----- //

      const pk_arrays = ['brand#printer-e2e', 'printer#printer-e2e'];

      const pk_promises = pk_arrays.map(pk => {
        const params: QueryCommandInput = {
          TableName: `MainTable-${process.env.ENVIRONMENT}`,
          KeyConditionExpression: '#pk = :pk',
          ExpressionAttributeNames: {
            '#pk': 'partition_key',
          },
          ExpressionAttributeValues: {
            ':pk': pk,
          },
        };

        const command = new QueryCommand(params);

        return dynamodb_documentclient.send(command);
      });

      const pk_queries = await Promise.all(pk_promises);

      const param: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'partition_key = :partition_key',
        FilterExpression: 'contains(email, :email)',
        ExpressionAttributeValues: {
          ':partition_key': 'admin',
          ':email': PRINTER_TEST_DOMAIN,
        },
      };

      const query_command = new QueryCommand(param);

      const { Items } = await dynamodb_documentclient.send(query_command);

      const all_items = pk_queries
        .map(item => item.Items)
        .flat()
        .concat(Items || []);

      if (all_items) {
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

        await Promise.all(
          chunk(deletes, 25).map(batch => {
            const params: BatchWriteCommandInput = {
              RequestItems: {
                [`MainTable-${process.env.ENVIRONMENT}`]: [...batch],
              },
            };

            const command = new BatchWriteCommand(params);
            return dynamodb_documentclient.send(command);
          }),
        );
      }

      console.log('DynamoDB cleaned successfully.');

      // ----- Delete TEST Cognito Users ----- //

      const cognito_user_promises = [
        delete_cognito_printer_user('user@printer-e2e.com'),
        delete_cognito_printer_user('main@printer-e2e.com'),
      ];

      await Promise.allSettled(cognito_user_promises);

      console.log('Cognito cleaned successfully.');

      return http_response({
        body: { message: 'Printer TEST Environment removed.' },
        status_code: 200,
      });
    } catch (error) {
      console.log('Error at DELETE /printer-test-data');
      console.log(error);

      return handle_http_error_response({ error });
    }
  };
