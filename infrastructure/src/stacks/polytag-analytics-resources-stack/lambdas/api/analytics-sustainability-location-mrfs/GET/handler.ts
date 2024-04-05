/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyEventV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_all_gtins } from '_helpers/analytics/get-all-gtins';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

/* ---------- Modules ---------- */
import { get_all_mrfs } from '_modules/mrfs/functions/get/get-all-mrfs';
import { get_uv_scans_count_by_mrf } from '_modules/analytics/functions/get/get-uv-scans-count-by-mrf';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Response {
  mrf_id: string;
  mrf_name: string;
  count: number;
  latitude: number;
  longitude: number;
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

    if (!roles[group]['analytics-sustainability']?.includes('GET') || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { gtins } = queryStringParameters;

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
     * Get all GTINs
     * ---------- */
    const gtin_array: string[] = [];
    const response: Response[] = [];

    const mrfs_array: Mrf[] = [];
    let last_key: string | undefined;

    do {
      const { last_evaluated_key, mrfs } = await get_all_mrfs({
        last_key,
      });

      mrfs_array.push(...mrfs);

      last_key = last_evaluated_key;
    } while (last_key);

    /* ----------
     * Fetching and parsing the GTINs
     * received from the query parameters
     * ---------- */
    if (gtins) {
      const gtins_to_query = JSON.parse(gtins);

      gtin_array.push(...gtins_to_query);
    }

    if (!gtins) await get_all_gtins({ brand_id, gtins: gtin_array });

    /* ----------
     * Query logic
     * ---------- */
    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const range_sql = date_range_sql(start_date, end_date);

    const { scans } = await get_uv_scans_count_by_mrf({
      gtins: gtin_array,
      range: range_sql,
    });

    scans.forEach(mrf_scan => {
      const mrf = mrfs_array.find(
        m => m.partition_key.replace('mrf#', '') === mrf_scan.mrf_id,
      );

      if (mrf?.location?.latitude && mrf?.location?.longitude) {
        response.push({
          count: mrf_scan.count,
          mrf_name: mrf.mrf_name,
          latitude: mrf.location.latitude,
          longitude: mrf.location.longitude,
          mrf_id: mrf.partition_key.replace('mrf#', ''),
        });
      }
    });

    return http_response({
      body: { mrfs_scans: response },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-sustainability/location-mrfs');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
