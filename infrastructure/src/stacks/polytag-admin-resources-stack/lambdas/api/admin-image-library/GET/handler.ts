/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { get_all_admin_images } from '_modules/image-library/functions/get/get-all-admin-images';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters?.image_name) {
      throw new Error(
        handle_http_error({ message: 'Not implemented', status_code: 400 }),
      );

      // Implement GET endpoint
    }

    const last_key = queryStringParameters?.last_key;

    const search = queryStringParameters?.search
      ?.replace(/\s/g, '_')
      .toLocaleLowerCase();

    /* ----------
     * LIST endpoint
     * ---------- */

    const { admin_images, last_evaluated_key } = await get_all_admin_images({
      search,
      last_key,
    });

    return http_response({
      body: { admin_images, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-image-library');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
