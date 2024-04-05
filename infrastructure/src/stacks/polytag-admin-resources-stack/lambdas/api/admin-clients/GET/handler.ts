/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { get_all_brands } from '_modules/brands/functions/get/get-all-brands';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters?.brand_id) {
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

    const { brands, last_evaluated_key } = await get_all_brands({
      last_key,
    });

    return http_response({
      body: { brands, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-clients');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
