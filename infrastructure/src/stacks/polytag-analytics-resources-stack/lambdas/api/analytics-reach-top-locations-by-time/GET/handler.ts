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
import {
  GetScansByUsageTimeOutput,
  get_scans_by_usage_time,
} from '_modules/analytics/functions/get/get-scans-by-usage-time';
import { filter_outliers } from '_helpers/analytics/math/filter-outliers';

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

    const { scans_by_usage_time } = await get_scans_by_usage_time({
      gtins: gtin_array,
      brand_id,
      product_groups: product_groups_array,
      range: time_range_sql,
    });

    const filtered = filter_outliers<GetScansByUsageTimeOutput>({
      array: scans_by_usage_time,
      value_property: 'usage',
    });

    const sorted = filtered.sort((a, b) => b.usage - a.usage);

    const top_5 = sorted.reduce((acc, curr) => {
      if (acc.length <= 4 && !acc.find(item => item.city === curr.city))
        acc.push(curr);

      return acc;
    }, [] as typeof sorted);

    return http_response({
      body: {
        top_locations_by_time: top_5,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-reach/top-locations-by-time');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
