/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_all_images } from '_modules/image-library/functions/get/get-all-images';
import { get_all_images_by_name } from '_modules/image-library/functions/get/get-all-images-by-name';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const last_key = queryStringParameters?.last_key;
    const image_name = queryStringParameters?.image_name;

    if (image_name) {
      const { images, last_evaluated_key } = await get_all_images_by_name({
        last_key,
        brand_id,
        image_name,
      });

      return http_response({
        body: { images, last_evaluated_key },
        status_code: 200,
      });
    }

    const { images, last_evaluated_key } = await get_all_images({
      brand_id,
      last_key,
    });

    return http_response({
      body: { images, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /image-library/list');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
