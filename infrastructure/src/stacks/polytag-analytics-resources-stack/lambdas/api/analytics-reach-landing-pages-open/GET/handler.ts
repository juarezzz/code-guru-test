/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_iso_timestamp_offset } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import {
  LandingPagesOpenViews,
  get_landing_pages_open,
} from '_modules/analytics/functions/get/get-landing-pages-open';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

/* ---------- Constants ---------- */
const SUPPORTED_VIEWS = ['campaign', 'product', 'product-group'];

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

    /* ----------
     * Checking if required params, body, authentication are
     * valid and present
     * ---------- */

    const { headers, queryStringParameters } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles[group]['analytics-reach'].includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { gtins, product_groups_sort_keys } = queryStringParameters;

    if (!queryStringParameters.start_date || !queryStringParameters.end_date) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );
    }

    if (
      queryStringParameters.view &&
      !SUPPORTED_VIEWS.includes(queryStringParameters.view)
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages['unsupported-view-type'].code,
          message: error_messages['unsupported-view-type'].message,
          status_code: 400,
        }),
      );
    }

    /* ----------
     * Preparing parameters for the SQL query
     * ---------- */
    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const timestamp_offset = get_iso_timestamp_offset({
      string_date: queryStringParameters.start_date,
    });

    const gtin_array: string[] = [];
    const product_groups_array: string[] = [];

    const view = (queryStringParameters.view ||
      'campaign') as LandingPagesOpenViews;

    if (gtins) gtin_array.push(...JSON.parse(gtins));

    if (product_groups_sort_keys)
      product_groups_array.push(...JSON.parse(product_groups_sort_keys));

    const { landing_pages_open, bucket } = await get_landing_pages_open({
      view,
      end_date,
      brand_id,
      start_date,
      timestamp_offset,
      gtins: gtin_array,
      product_groups: product_groups_array,
    });

    return http_response({
      body: {
        view,
        bucket,
        landing_pages_open,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-reach/landing-pages-open');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
