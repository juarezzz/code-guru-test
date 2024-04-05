/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Modules ---------- */
import { get_all_landing_pages } from '_modules/landing-pages/functions/get/get-all-landing-pages';
import { get_all_landing_pages_by_name } from '_modules/landing-pages/functions/get/get-all-landing-pages-by-name';
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    /* ----------
     * That's responsible for keeping the Lambda warm
     * and it returns just in case the event is from a scheduled cron.
     * ---------- */
    if (event.source && event.source === 'aws.events') {
      console.log('Keeping the lambda warm.');

      return http_response({
        body: { message: 'Getting warm.' },
        status_code: 200,
      });
    }

    const { headers, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': cognito_groups } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-landing-pages']?.includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const landing_page_name = queryStringParameters?.landing_page_name;
    const landing_page_sort_key = queryStringParameters?.landing_page_sort_key;

    /* ----------
     * GET endpoint
     * ---------- */
    if (landing_page_sort_key) {
      const { landing_page } = await get_landing_page_by_sort_key({
        brand_id,
        landing_page_sort_key,
      });

      if (!landing_page)
        throw new Error(
          handle_http_error({
            message: error_messages['landing-page-does-not-exist'].message,
            status_code: 404,
            code: error_messages['landing-page-does-not-exist'].code,
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
    }

    /* ----------
     * SEARCH endpoint
     * ---------- */
    if (landing_page_name) {
      const { landing_pages: landing_pages_search } =
        await get_all_landing_pages_by_name({
          brand_id,
          landing_page_name,
        });

      return http_response({
        body: {
          landing_pages: landing_pages_search.map(landing_page => ({
            ...landing_page,
            components: JSON.parse(landing_page.components),
            global_styles: JSON.parse(landing_page.global_styles),
          })),
        },
        status_code: 200,
      });
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, landing_pages } = await get_all_landing_pages({
      brand_id,
      last_key,
    });

    const formatted_landing_pages = landing_pages.map(landing_page => ({
      ...landing_page,
      components: JSON.parse(landing_page.components),
      global_styles: JSON.parse(landing_page.global_styles),
    }));

    return http_response({
      body: {
        landing_pages: formatted_landing_pages,
        last_evaluated_key,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /brand-landing-pages');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
