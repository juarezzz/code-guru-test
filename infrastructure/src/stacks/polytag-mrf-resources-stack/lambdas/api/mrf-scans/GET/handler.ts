/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { get_iso_timestamp_offset } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';
import { Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { get_mrf_scans } from '_modules/mrfs/functions/get/get-mrf-scans';
import { get_all_products } from '_modules/products/functions/get/get-all-products';
import { get_mrf_scans_overtime } from '_modules/mrfs/functions/get/get-mrf-scans-overtime';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface MrfScanBrand {
  brand_id: string;
  material: string;
  brand_name: string;
  product_name: string;
  gross_weight: number;
  mrf_throughput: number;
}

export interface MrfScanOvertimeBrand {
  count: number;
  brand_id: string;
  brand_name: string;
}

type MrfScansOvertimeBrand = Record<string, MrfScanOvertimeBrand[]>;

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

    const { 'cognito:groups': cognito_groups, 'custom:mrf_id': mrf_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['mrf-scans']?.includes('GET')) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    if (
      !queryStringParameters?.end_date ||
      !queryStringParameters?.start_date
    ) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
        }),
      );
    }

    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const timestamp_offset = get_iso_timestamp_offset({
      string_date: queryStringParameters.start_date,
    });

    const range_sql = date_range_sql(start_date, end_date);

    /* ----------
     * Get all the scans for the given date range.
     * ---------- */

    const [
      { mrf_scans: gtin_mrf_scans },
      { mrf_scans_overtime: gtin_mrf_scans_overtime, bucket },
    ] = await Promise.all([
      get_mrf_scans({
        range: range_sql,
        mrf_id,
      }),
      get_mrf_scans_overtime({
        mrf_id,
        end_date,
        start_date,
        timestamp_offset,
      }),
    ]);

    /* ----------
     * Fetching all products
     * ---------- */

    const mrf_scans: MrfScanBrand[] = [];
    const mrf_scans_overtime: MrfScansOvertimeBrand = {};

    const products_hashmap: Map<string, Product> = new Map();

    let last_key: string | undefined;

    do {
      const { products, last_evaluated_key } = await get_all_products({
        last_key,
      });
      last_key = last_evaluated_key;
      products.forEach(product => {
        if (product) products_hashmap.set(product.gtin, product);
      });
    } while (last_key);

    const products_array: Product[] = [];

    gtin_mrf_scans.forEach(({ gtin }) => {
      const product = products_hashmap.get(gtin);
      if (product) products_array.push(product);
    });

    /* ----------
     * Fetching brands based on the products
     * ---------- */

    const brands_hashmap: Map<string, Brand> = new Map();

    const unique_brand_ids_list = new Set<string>();

    Object.values(products_array).forEach(({ partition_key }) => {
      const brand_id = partition_key.split('#')[1];

      unique_brand_ids_list.add(brand_id);
    });

    const brand_ids_batches = chunk(Array.from(unique_brand_ids_list), 25);

    for (const brand_ids_batch of brand_ids_batches) {
      const brands = await Promise.all(
        brand_ids_batch.map(brand_id => get_brand({ brand_id })),
      );

      const filtered_brands = brands.filter(({ brand }) => !!brand) as {
        brand: Brand;
      }[];

      filtered_brands.forEach(({ brand }) => {
        brands_hashmap.set(brand.partition_key, brand);
      });
    }

    /* ----------
     * Formatting MRF scans with material information
     * ---------- */

    for (const product of products_array) {
      const { partition_key } = product;

      const brand = brands_hashmap.get(partition_key);
      const scans = gtin_mrf_scans.find(scan => scan.gtin === product.gtin);

      let gross_weight = 0;
      let material = '';

      if (!brand || !scans) continue;

      if (product.components.length) {
        const component = product.components.reduce((prev, current) => {
          return prev.weight > current.weight ? prev : current;
        });

        material = component.material;

        gross_weight = product.components.reduce((accumulator, current) => {
          return accumulator + current.weight * scans.count;
        }, 0);
      }

      const mrf_scan: MrfScanBrand = {
        material,
        gross_weight,
        mrf_throughput: scans.count,
        brand_name: brand.brand_name,
        product_name: product.product_name,
        brand_id: brand.partition_key.replace('brand#', ''),
      };

      mrf_scans.push(mrf_scan);
    }

    /* ----------
     * Grouping overtime scans by brand
     * ---------- */

    for (const date in gtin_mrf_scans_overtime) {
      if (!Object.prototype.hasOwnProperty.call(gtin_mrf_scans_overtime, date))
        continue;

      const scans = gtin_mrf_scans_overtime[date];

      mrf_scans_overtime[date] = scans.reduce((result, current) => {
        const existing_product = products_hashmap.get(current.gtin);

        if (!existing_product) return result;

        const product_brand = brands_hashmap.get(
          existing_product.partition_key,
        );

        if (!product_brand) return result;

        const product_brand_id = product_brand.partition_key.split('#')[1];

        const existing_entry = result.findIndex(
          ({ brand_id }) => brand_id === product_brand_id,
        );

        if (existing_entry !== -1) {
          result[existing_entry].count += current.count;
        } else {
          result.push({
            brand_id: product_brand_id,
            count: current.count,
            brand_name: product_brand.brand_name,
          });
        }

        return result;
      }, [] as MrfScanOvertimeBrand[]);
    }

    return http_response({
      body: {
        bucket,
        mrf_scans,
        mrf_scans_overtime,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /mrf-scans');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
