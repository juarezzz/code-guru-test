/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Modules ---------- */
import { get_top_campaigns } from '_modules/analytics/functions/get/get-top-campaigns';

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

    /* ----------
     * Lambda logic starts here
     * ---------- */
    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const time_range_sql = date_range_sql(start_date, end_date);

    const gtin_array: string[] = [];
    const product_groups_array: string[] = [];

    if (gtins) gtin_array.push(...JSON.parse(gtins));

    if (product_groups_sort_keys)
      product_groups_array.push(...JSON.parse(product_groups_sort_keys));

    const { top_campaigns } = await get_top_campaigns({
      product_groups: product_groups_array,
      range: time_range_sql,
      brand_id,
      gtins: gtin_array,
    });

    return http_response({
      body: {
        top_campaigns,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-reach/top-campaigns');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
