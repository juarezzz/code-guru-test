/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { delete_image } from '_modules/image-library/functions/delete/delete-image';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { sort_key, s3_key } = queryStringParameters;

    if (!sort_key || !s3_key)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 401,
        }),
      );

    await delete_image({
      sort_key,
      brand_id,
      s3_key,
    });

    return http_response({
      body: { message: 'The image was deleted successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /image-library');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
