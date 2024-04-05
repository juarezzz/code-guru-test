/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { delete_polytag_admin } from '_modules/users/functions/delete/delete-polytag-admin';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    if (!queryStringParameters || !queryStringParameters.user_sub)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { user_sub } = queryStringParameters;

    await delete_polytag_admin({ user_sub });

    return http_response({
      body: { message: 'User deleted successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /admin-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
