/* -------------- External -------------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* -------------- Helpers -------------- */
import { get_all_gtins } from '_helpers/analytics/get-all-gtins';
import { http_response } from '_helpers/responses/http-response';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { paginate_function } from '_helpers/recursive-functions/paginate-function';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { get_product_group_gtins } from '_helpers/analytics/get-product-group-gtins';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* -------------- Models -------------- */
import { ProductGroup } from '_modules/product-groups/models';
import { Components, Product } from '_modules/products/models';

/* -------------- Modules -------------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';
import { get_all_product_groups } from '_modules/product-groups/functions/get/get-all-product-groups';
import { get_labels_printed_count_by_gtin } from '_modules/analytics/functions/get/get-labels-printed-count-by-gtin';

/* -------------- Interfaces -------------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface FixedData {
  product_name: string;
  gtin: string;
  product_group: string;
  printed: number;
  materials_gross_weight: number;
  materials: Components[];
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
     * Get all GTINs
     * ---------- */
    const gtin_array: string[] = [];

    /* ----------
     * Fetching and parsing the GTINs
     * received from the query parameters
     * ---------- */
    if (gtins) {
      const gtins_to_query = JSON.parse(gtins);

      gtin_array.push(...gtins_to_query);
    }

    /* ----------
     * Fetching and parsing the groups
     * received from the query parameters,
     * then getting their products' GTINs
     * ---------- */
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

    if (!gtins && !product_groups_sort_keys)
      await get_all_gtins({ brand_id, gtins: gtin_array });

    /* ----------
     * Fetching the tags printed
     * ---------- */
    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const range_sql = date_range_sql(start_date, end_date);

    const { labels_printed } = await get_labels_printed_count_by_gtin({
      gtins: gtin_array,
      range: range_sql,
    });

    /* ----------
     * Fetching the products & product groups
     * ---------- */
    const { products: products_array } = await paginate_function(
      get_all_products,
      {
        brand_id,
      },
    );

    const { product_groups: product_groups_array } = await paginate_function(
      get_all_product_groups,
      {
        brand_id,
      },
    );

    /* ----------
     * Handling the data
     * ---------- */
    const fixed_data = new Map<string, FixedData>();

    for await (const printed of labels_printed) {
      const { gtin } = printed;
      const product = products_array.find(p => p.gtin === gtin);

      if (!product || !product.product_group_sort_key) continue;

      fixed_data.set(gtin, {
        gtin,
        materials: [],
        product_group: '',
        product_name: product.product_name,
        materials_gross_weight: 0,
        printed: 0,
      });

      const product_group = product_groups_array.find(
        pg => pg.sort_key === product.product_group_sort_key,
      );

      if (!product_group) continue;

      let gross_weight = 0;
      const materials: Record<string, Components> = {};

      product.components.forEach(component => {
        if (component.weight) {
          gross_weight += Number(component.weight);

          materials[component.id] = {
            id: component.id,
            weight: component.weight,
            material: component.material,
            name: component.name,
            percentage: component.percentage,
          };
        }
      });

      const current_fixed_data = fixed_data.get(gtin);

      if (current_fixed_data) {
        fixed_data.set(gtin, {
          materials_gross_weight:
            current_fixed_data.materials_gross_weight + gross_weight,
          gtin,
          materials: Object.values(materials),
          printed: current_fixed_data.printed + printed.count,
          product_group: product_group.product_group_name,
          product_name: current_fixed_data.product_name,
        });
      } else {
        fixed_data.set(gtin, {
          product_name: product.product_name,
          gtin,
          product_group: product_group.product_group_name,
          printed: printed.count,
          materials_gross_weight: gross_weight,
          materials: Object.values(materials),
        });
      }
    }

    const total = Array.from(fixed_data.values()).reduce<number>(
      (previous_value, current_value) => previous_value + current_value.printed,
      0,
    );

    return http_response({
      body: {
        tags_printed: Array.from(fixed_data.values()),
        total,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-sustainability/tags-printed');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
