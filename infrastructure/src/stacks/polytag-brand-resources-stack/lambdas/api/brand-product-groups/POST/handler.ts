/* ---------- External ---------- */
import * as Yup from 'yup';
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
import { create_product_group } from '_modules/product-groups/functions/create/create-product-group';
import { get_product_group_by_name } from '_modules/product-groups/functions/get/get-product-group-by-name';

/* ---------- Schemas ---------- */
const create_product_group_schema = Yup.object({
  product_group_name: Yup.string().required().min(2).max(255),
});

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

    const { body, headers } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const {
      'cognito:groups': cognito_groups,
      'custom:brand_id': brand_id,
      'custom:full_name': name,
      sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-product-groups']?.includes('POST'))
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
     * Create a product group based on JSON body
     * ---------- */
    const product_group_json = JSON.parse(body);

    await create_product_group_schema.validate(product_group_json);

    const found_product_group_item = await get_product_group_by_name({
      brand_id,
      product_group_name: product_group_json.product_group_name.trim(),
    });

    if (found_product_group_item)
      throw new Error(
        handle_http_error({
          message: error_messages['product-group-already-exists'].message,
          status_code: 400,
          code: error_messages['product-group-already-exists'].code,
        }),
      );

    /* ----------
     * Create a product group or grab existing one
     * ---------- */
    const product_group = await create_product_group({
      brand_id,
      product_group_name: product_group_json.product_group_name,
      owner_name: name,
      owner_sub: sub,
    });

    return http_response({ body: { product_group }, status_code: 200 });
  } catch (error) {
    console.error('Error at POST /brand-product-groups');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
