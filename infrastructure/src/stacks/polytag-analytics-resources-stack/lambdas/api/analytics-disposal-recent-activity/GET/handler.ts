/* ---------- External ---------- */
import { chunk } from 'lodash';
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

/* ---------- Models ---------- */
import { ThirdParty } from '_modules/third-party/models';

/* ---------- Modules ---------- */
import { get_disposal_recent_activity } from '_modules/analytics/functions/get/get-disposal-recent-activity';
import { get_third_party_by_id } from '_modules/third-party/functions/get/get-third-party-by-id';

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

    if (!roles?.[group]?.['analytics-disposal']?.includes('GET'))
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

    const recent_activity = await get_disposal_recent_activity({
      gtins: gtins_array,
    });

    /* ----------
     * Fetching third party info
     * ---------- */
    const third_parties: ThirdParty[] = [];

    const third_party_ids = new Set(
      recent_activity.map(({ third_party_id }) => third_party_id),
    );

    const fetch_third_parties_commands = Array.from(third_party_ids).map(
      third_party_id => get_third_party_by_id({ third_party_id }),
    );

    const fetch_third_parties_commands_batches = chunk(
      fetch_third_parties_commands,
      25,
    );

    for (const fetch_third_parties_commands_batch of fetch_third_parties_commands_batches) {
      const new_third_parties = await Promise.all(
        fetch_third_parties_commands_batch,
      );

      const filtered = new_third_parties.filter(
        ({ third_party }) => !!third_party,
      ) as { third_party: ThirdParty }[];

      third_parties.push(...filtered.map(({ third_party }) => third_party));
    }

    const named_recent_activity = recent_activity.map(activity => {
      const matching_third_party = third_parties.find(
        third_party =>
          third_party.partition_key ===
          `third-party#${activity.third_party_id}`,
      );

      if (!matching_third_party) return activity;

      return {
        ...activity,
        third_party_name: matching_third_party.third_party_name,
      };
    });

    return http_response({
      body: { recent_activity: named_recent_activity },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-disposal/recent-activity');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
