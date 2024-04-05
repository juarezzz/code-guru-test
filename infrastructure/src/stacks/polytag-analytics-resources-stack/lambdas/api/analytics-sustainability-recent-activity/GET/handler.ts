/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_all_gtins } from '_helpers/analytics/get-all-gtins';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { get_product_group_gtins } from '_helpers/analytics/get-product-group-gtins';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_sustainability_recent_activity } from '_modules/analytics/functions/get/get-sustainability-recent-activity';
import { Mrf } from '_modules/mrfs/models';
import { get_mrf_by_id } from '_modules/mrfs/functions/get/get-mrf-by-id';
import { chunk } from 'lodash';

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

    const gtins = queryStringParameters?.gtins;

    const product_groups_sort_keys =
      queryStringParameters?.product_groups_sort_keys;

    /* ----------
     * Preparing parameters for the SQL query
     * ---------- */
    const gtins_array: string[] = [];

    if (gtins) {
      const gtins_to_query = JSON.parse(gtins);

      gtins_array.push(...gtins_to_query);
    }

    if (product_groups_sort_keys) {
      const product_groups_to_query_sort_keys: string[] = JSON.parse(
        product_groups_sort_keys,
      );
      const is_array = Array.isArray(product_groups_to_query_sort_keys);

      if (is_array && product_groups_to_query_sort_keys.length > 0) {
        for (const product_group_sort_key of product_groups_to_query_sort_keys) {
          await get_product_group_gtins({
            brand_id,
            gtins: gtins_array,
            product_group_sort_key,
          });
        }
      }
    }

    if (!gtins && !product_groups_sort_keys)
      await get_all_gtins({ brand_id, gtins: gtins_array });

    const recent_activity = await get_sustainability_recent_activity({
      gtins: gtins_array,
    });

    /* ----------
     * Fetching MRFs info
     * ---------- */
    const mrfs: Mrf[] = [];

    const mrf_ids = new Set(recent_activity.map(({ mrf_id }) => mrf_id));

    const fetch_mrfs_commands = Array.from(mrf_ids).map(mrf_id =>
      get_mrf_by_id({ mrf_id }),
    );

    const fetch_mrfs_commands_batches = chunk(fetch_mrfs_commands, 25);

    for (const fetch_mrfs_commands_batch of fetch_mrfs_commands_batches) {
      const new_mrfs = await Promise.all(fetch_mrfs_commands_batch);

      const filtered = new_mrfs.filter(({ mrf }) => !!mrf) as { mrf: Mrf }[];

      mrfs.push(...filtered.map(({ mrf }) => mrf));
    }

    const named_recent_activity = recent_activity.map(activity => {
      const matching_mrf = mrfs.find(
        mrf => mrf.partition_key === `mrf#${activity.mrf_id}`,
      );

      if (!matching_mrf) return activity;

      return {
        ...activity,
        mrf_name: matching_mrf.mrf_name,
      };
    });

    return http_response({
      body: { recent_activity: named_recent_activity },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-sustainability/recent-activity');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
