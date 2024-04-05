/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { get_all_polytag_admins } from '_modules/users/functions/get/get-all-polytag-admins';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters?.admin_id) {
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

    const { admins, last_evaluated_key } = await get_all_polytag_admins({
      last_key,
    });

    return http_response({
      body: { admins, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
