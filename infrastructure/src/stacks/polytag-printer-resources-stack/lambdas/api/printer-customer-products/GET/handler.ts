/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

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
import { get_printer_brand_association_by_brand_id } from '_modules/printer/functions/get/get-printer-brand-association-by-brand-id';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const {
      'cognito:groups': cognito_groups,
      'custom:printer_id': printer_id,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['printer-customer-products']?.includes('GET') ||
      !printer_id
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    if (!queryStringParameters?.brand_id) {
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );
    }

    const { brand_id } = queryStringParameters;

    const { brand_assocation } =
      await get_printer_brand_association_by_brand_id({
        brand_id,
        printer_id,
      });

    if (!brand_assocation) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );
    }

    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, products: customer_products } =
      await get_all_products({
        brand_id,
        last_key,
      });

    return http_response({
      body: { customer_products, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /printer-customer-products');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
