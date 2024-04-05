/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Functions ---------- */
import { delete_mrf_user } from '_modules/users/functions/delete/delete-mrf-user';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['admin-mrf-users']?.includes('DELETE'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!queryStringParameters)
      throw new Error(
        httpError({
          message: 'Missing query string parameters',
          status_code: 400,
        }),
      );

    const { mrf_id, mrf_user_id } = queryStringParameters;

    if (!mrf_id || !mrf_user_id)
      throw new Error(
        httpError({
          message: 'Missing mrf_id or mrf_user_id',
          status_code: 400,
        }),
      );

    await delete_mrf_user({ mrf_id, mrf_user_id });

    return http_response({
      body: {
        message: 'MRF User deleted',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /admin-mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
