/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    if (!id_token)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { 'custom:mrf_id': mrf_id } = get_authenticated_user({
      token: id_token,
    });

    if (!mrf_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const healthcheck_result = {
      datatype: 'mrf-healthcheck',
      last_request: new Date().getTime(),
      partition_key: `mrf#${mrf_id}`,
      sort_key: `mrf-healthcheck`,
    };

    const params: PutCommandInput = {
      Item: healthcheck_result,
      TableName: process.env.TABLE_NAME,
    };

    const command = new PutCommand(params);

    await dynamodb_documentclient.send(command);

    return http_response({
      status_code: 201,
      body: {},
    });
  } catch (error) {
    console.error('Error at POST /mrf-healthcheck');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
