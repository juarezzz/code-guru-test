/* ---------- External ---------- */
import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { DeleteRequest } from '@aws-sdk/client-dynamodb';
import {
  DeleteTableCommand,
  DeleteTableCommandInput,
} from '@aws-sdk/client-timestream-write';
import { chunk } from 'lodash';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { timestream_client_write } from '_clients/timestream';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { delete_cognito_mrf_user } from '_modules/users/functions/delete/delete-cognito-mrf-user';

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

    // ----- Delete TEST Dynamo objects ----- //

    const pk_arrays = ['mrf#mrf-e2e', 'brand#mrf-e2e'];

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

    const invite_params: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      IndexName: 'datatype-index',
      KeyConditionExpression: 'datatype = :datatype',
      FilterExpression: 'contains(sort_key, :sort_key)',
      ExpressionAttributeValues: {
        ':datatype': 'mrf-user-invite',
        ':sort_key': 'mrf-e2e.com',
      },
    };

    const user_invite_command = new QueryCommand(invite_params);

    const invites = await dynamodb_documentclient.send(user_invite_command);

    const all_items = pk_queries
      .map(item => item.Items)
      .flat()
      .concat(invites.Items);

    const deletes: { DeleteRequest: DeleteRequest }[] = all_items.map(Item => ({
      DeleteRequest: {
        Key: {
          partition_key: Item?.partition_key,
          sort_key: Item?.sort_key,
        },
      },
    }));

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

    console.log('DynamoDB cleaned successfully.');

    // ----- Delete TEST Cognito Users ----- //

    await Promise.allSettled([
      delete_cognito_mrf_user('main@mrf-e2e.com'),
      delete_cognito_mrf_user('user@mrf-e2e.com'),
    ]);

    console.log('Cognito cleaned successfully.');

    // ----- Delete TEST Timestream table ----- //

    const delete_table_params: DeleteTableCommandInput = {
      DatabaseName: process.env.TIMESTREAM_NAME,
      TableName: process.env.TIMESTREAM_NAME,
    };

    const delete_table_command = new DeleteTableCommand(delete_table_params);
    await timestream_client_write.send(delete_table_command);

    console.log('Timestream cleaned successfully.');

    return http_response({
      body: { message: 'Mrf Test environment cleared.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /mrf-test-data');
    console.log(error);

    return handle_http_error_response({ error });
  }
};
