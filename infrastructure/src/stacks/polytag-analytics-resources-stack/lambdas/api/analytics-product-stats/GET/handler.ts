/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { lastDayOfMonth, subMonths, startOfMonth } from 'date-fns';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modues ---------- */
import { get_scans } from '_modules/analytics/functions/get/get-scans';
import { get_uv_scans_count } from '_modules/analytics/functions/get/get-uv-scans-count';
import { get_labels_printed_count } from '_modules/analytics/functions/get/get-labels-printed-count';

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
    const { queryStringParameters, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['analytics-product-stats']?.includes('GET') ||
      !brand_id
    )
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!queryStringParameters?.date || !queryStringParameters?.gtin) {
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );
    }

    const { date, gtin } = queryStringParameters;

    const today = new Date(date);
    const last_month = subMonths(today, 1);

    const first_day_of_month = startOfMonth(today);
    const last_day_of_month = lastDayOfMonth(today);

    const first_day_of_last_month = startOfMonth(last_month);
    const last_day_of_last_month = lastDayOfMonth(last_month);

    const this_month_range = date_range_sql(
      first_day_of_month,
      last_day_of_month,
    );

    const last_month_range = date_range_sql(
      first_day_of_last_month,
      last_day_of_last_month,
    );

    const [
      { scans: current_scans },
      { scans: previous_scans },

      { printed: current_printed },
      { printed: previous_printed },

      { scans: current_recycled },
      { scans: previous_recycled },
    ] = await Promise.all([
      /**
       * QR Scans
       */
      get_scans({
        brand_id,
        gtins: [gtin],
        range: this_month_range,
      }),
      get_scans({
        brand_id,
        gtins: [gtin],
        range: last_month_range,
      }),

      /**
       * Labels Printed
       */
      get_labels_printed_count({
        gtins: [gtin],
        range: this_month_range,
      }),
      get_labels_printed_count({
        gtins: [gtin],
        range: this_month_range,
      }),

      /**
       * UV Scans
       */
      get_uv_scans_count({
        gtins: [gtin],
        range: this_month_range,
      }),
      get_uv_scans_count({
        gtins: [gtin],
        range: this_month_range,
      }),
    ]);

    let difference_in_percentage_scans = '0';
    let difference_in_percentage_printed = '0';
    let difference_in_percentage_recycled = '0';

    if (previous_scans !== 0) {
      difference_in_percentage_scans = Number(
        ((current_scans - previous_scans) / previous_scans) * 100,
      ).toFixed(2);
    }

    if (previous_printed !== 0) {
      difference_in_percentage_printed = Number(
        ((current_printed - previous_printed) / previous_printed) * 100,
      ).toFixed(2);
    }

    if (previous_recycled !== 0) {
      difference_in_percentage_recycled = Number(
        ((current_recycled - previous_recycled) / previous_recycled) * 100,
      ).toFixed(2);
    }

    return http_response({
      body: {
        current_printed,
        current_recycled,
        current_scans,
        difference_in_percentage_printed,
        difference_in_percentage_recycled,
        difference_in_percentage_scans,
        previous_printed,
        previous_recycled,
        previous_scans,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-product-stats');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
