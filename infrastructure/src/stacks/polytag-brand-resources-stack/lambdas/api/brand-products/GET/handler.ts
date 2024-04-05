/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { uniqBy } from 'lodash';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';
import { get_all_products_by_name } from '_modules/products/functions/get/get-all-products-by-name';
import { get_all_products_by_gtin } from '_modules/products/functions/get/get-all-products-by-gtin';

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

    const { queryStringParameters, headers } = event;

    const product_id = queryStringParameters?.product_id;
    const product_name = queryStringParameters?.product_name;

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': cognito_groups } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-products']?.includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    /* ----------
     * GET endpoint
     * ---------- */
    if (product_id) {
      throw new Error(
        handle_http_error({ message: 'Not implemented', status_code: 400 }),
      );

      // const { brand_id } = queryStringParameters;
      //
      // Implement GET endpoint
    }

    /* ----------
     * SEARCH endpoint
     * ---------- */
    if (product_name) {
      const [{ products: name_products }, { products: gtin_products }] =
        await Promise.all([
          get_all_products_by_name({
            brand_id,
            product_name,
          }),

          get_all_products_by_gtin({
            gtin: product_name,
          }),
        ]);

      const products = uniqBy([...gtin_products, ...name_products], 'sort_key');

      return http_response({
        body: { products },
        status_code: 200,
      });
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, products } = await get_all_products({
      last_key,
      brand_id,
    });

    return http_response({
      body: { products, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /brand-products');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
