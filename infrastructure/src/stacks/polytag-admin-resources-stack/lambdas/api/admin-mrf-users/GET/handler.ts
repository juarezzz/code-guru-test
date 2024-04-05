/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Functions ---------- */
import { get_all_mrf_users } from '_modules/users/functions/get/get-all-mrf-users';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    if (!queryStringParameters?.mrf_id) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );
    }

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters?.mrf_user_id) {
      throw new Error(
        httpError({ message: 'Not implemented', status_code: 400 }),
      );
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const { mrf_id } = queryStringParameters;

    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, mrf_users } = await get_all_mrf_users({
      mrf_id,
      last_key,
    });

    return http_response({
      body: { mrf_users, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
