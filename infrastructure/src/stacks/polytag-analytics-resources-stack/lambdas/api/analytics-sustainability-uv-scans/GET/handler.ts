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
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_uv_scans } from '_modules/analytics/functions/get/get-uv-scans';
import { paginate_function } from '_helpers/recursive-functions/paginate-function';
import { get_all_products } from '_modules/products/functions/get/get-all-products';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Material {
  weight: number;
  material: string;
  percentage: number;
}

interface Entry {
  gtin: string;
  count: number;
  product_name: string;
  gross_weight: number;
  materials: Material[];
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

    if (!roles[group]['analytics-sustainability'].includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
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
     * Lambda logic starts here
     * ---------- */
    const start_date = new Date(queryStringParameters.start_date);
    const end_date = new Date(queryStringParameters.end_date);

    const time_range_sql = date_range_sql(start_date, end_date);

    const gtin_array: string[] = [];

    if (gtins) gtin_array.push(...JSON.parse(gtins));

    /* ----------
     * Fetching the products
     * ---------- */
    const { products: products_array } = await paginate_function(
      get_all_products,
      { brand_id },
    );

    const { uv_scans } = await get_uv_scans({
      range: time_range_sql,
      gtins: gtin_array,
    });

    const scans: Entry[] = [];

    for (const scan of uv_scans) {
      const product = products_array.find(p => p.gtin === scan.gtin);

      if (!product) continue;

      const materials: Record<string, Material> = {};

      const entry: Entry = {
        gtin: scan.gtin,
        count: scan.count,
        product_name: product.product_name,
        gross_weight: 0,
        materials: [],
      };

      product.components.forEach(component => {
        if (component.weight) {
          entry.gross_weight += +component.weight;

          if (materials[component.material]) {
            materials[component.material].weight += +component.weight;
          } else {
            materials[component.material] = {
              weight: +component.weight,
              material: component.material,
              percentage: +component.percentage,
            };
          }
        }
      });

      entry.gross_weight *= +entry.count;

      entry.materials = Object.values(materials);

      scans.push(entry);
    }

    return http_response({
      body: {
        uv_scans: scans,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /analytics-sustainability/uv-scans');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
