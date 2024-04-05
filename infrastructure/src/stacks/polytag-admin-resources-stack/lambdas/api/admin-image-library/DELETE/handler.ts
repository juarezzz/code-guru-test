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
import { delete_admin_image } from '_modules/image-library/functions/delete/delete-admin-image';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { sort_key, image_name } = queryStringParameters;

    if (!sort_key || !image_name)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    await delete_admin_image({
      sort_key,
      image_name: image_name.replace(/\s/g, '_').toLocaleLowerCase(),
    });

    return http_response({
      body: { message: 'The image was deleted successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /admin-image-library');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
