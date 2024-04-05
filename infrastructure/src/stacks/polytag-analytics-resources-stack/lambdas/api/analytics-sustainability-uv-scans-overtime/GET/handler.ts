/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { get_all_gtins } from '_helpers/analytics/get-all-gtins';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { get_product_group_gtins } from '_helpers/analytics/get-product-group-gtins';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_iso_timestamp_offset } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_sustainability_uv_scans_overtime } from '_modules/analytics/functions/get/get-sustainability-uv-scans-overtime';

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

    if (!roles?.[group]?.['analytics-sustainability']?.includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { gtins, product_groups_sort_keys } = queryStringParameters;

    if (
      !queryStringParameters?.start_date ||
      !queryStringParameters?.end_date
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
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

    if (gtins) gtin_array.push(...JSON.parse(gtins));

    if (product_groups_sort_keys) {
      const product_groups_to_query_sort_keys: string[] = JSON.parse(
        product_groups_sort_keys,
      );

      const is_array = Array.isArray(product_groups_to_query_sort_keys);

      if (is_array && product_groups_to_query_sort_keys.length > 0) {
        for (const product_group_sort_key of product_groups_to_query_sort_keys) {
          await get_product_group_gtins({
            brand_id,
            gtins: gtin_array,
            product_group_sort_key,
          });
        }
      }
    }

    if (!gtins && !product_groups_sort_keys) {
      await get_all_gtins({ brand_id, gtins: gtin_array });
    }

    const { sustainability_uv_scans_overtime, bucket } =
      await get_sustainability_uv_scans_overtime({
        end_date,
        start_date,
        timestamp_offset,
        gtins: gtin_array,
      });

    return http_response({
      body: {
        bucket,
        sustainability_uv_scans_overtime,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-sustainability/uv-scans-overtime');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
