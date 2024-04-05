/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Clients ---------- */
import { get_all_third_party_users } from '_modules/users/functions/get/get-all-third-party-users';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    const third_party_id = queryStringParameters?.third_party_id;
    const third_party_user_id = queryStringParameters?.third_party_user_id;

    if (!third_party_id) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
        }),
      );
    }

    /* ----------
     * GET endpoint
     * ---------- */
    if (third_party_user_id) {
      throw new Error(
        httpError({ message: 'Not implemented', status_code: 400 }),
      );

      // const { brand_id } = queryStringParameters;
      //
      // Implement GET endpoint
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, third_party_users } =
      await get_all_third_party_users({
        last_key,
        third_party_id,
      });

    return http_response({
      body: { third_party_users, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-third-party-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
