/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';

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

    const { sort_key, brand_id } = queryStringParameters;

    if (!sort_key || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { landing_page } = await get_landing_page_by_sort_key({
      brand_id,
      landing_page_sort_key: sort_key,
    });

    if (!landing_page)
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['landing-page-does-not-exist'].code,
          message: error_messages['landing-page-does-not-exist'].message,
        }),
      );

    return http_response({
      body: {
        landing_page: {
          ...landing_page,
          components: JSON.parse(landing_page.components),
          global_styles: JSON.parse(landing_page.global_styles),
        },
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /landing-page-preview');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
