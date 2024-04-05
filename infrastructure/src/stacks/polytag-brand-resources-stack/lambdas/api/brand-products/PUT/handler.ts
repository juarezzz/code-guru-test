/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import * as Yup from 'yup';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Models ---------- */
import { Attributes, Components } from '_modules/products/models';
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Modules ---------- */
import { create_product_group } from '_modules/product-groups/functions/create/create-product-group';
import { get_product_group_by_name } from '_modules/product-groups/functions/get/get-product-group-by-name';
import { update_product } from '_modules/products/functions/update/update-product';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  attributes?: Attributes[];
  components?: Components[];
  product_description?: string;
  product_group_name?: string;
  product_name?: string;
  product_sort_key: string;
}

/* ---------- Schemas ---------- */
const schema = Yup.object({
  product_sort_key: Yup.string().required(),

  product_group_name: Yup.string(),

  product_name: Yup.string(),
  product_description: Yup.string(),

  components: Yup.array().of(
    Yup.object({
      id: Yup.string().required(),
      material: Yup.string().required(),
      name: Yup.string().required(),
      percentage: Yup.number().required(),
      weight: Yup.number().required(),
    }),
  ),
  attributes: Yup.array().of(
    Yup.object({
      id: Yup.string().required(),
      name: Yup.string().required(),
      value: Yup.string().required(),
    }),
  ),
});

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
      'custom:full_name': owner_name,
      'custom:brand_id': brand_id,
      sub: owner_sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-products']?.includes('PUT'))
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

    const product_input: Body = JSON.parse(body);

    await schema.validate(product_input);

    let product_group: ProductGroup | undefined;
    let product_group_sort_key: string | undefined;

    /* ----------
     * Create a product group if it doesn't exist
     * ---------- */
    if (product_input.product_group_name) {
      product_group = await get_product_group_by_name({
        brand_id,
        product_group_name: product_input.product_group_name,
      });

      if (product_group) {
        product_group_sort_key = product_group.sort_key;
      } else {
        product_group = await create_product_group({
          brand_id,
          owner_name,
          owner_sub,
          product_group_name: product_input.product_group_name,
        });

        product_group_sort_key = product_group.sort_key;
      }
    }

    const product = await update_product({
      brand_id,
      product_sort_key: product_input.product_sort_key,
      attributes: product_input.attributes,
      components: product_input.components,
      product_description: product_input.product_description,
      product_group_name: product_input.product_group_name,
      product_name: product_input.product_name,
      product_group_sort_key,
    });

    return http_response({ body: { product }, status_code: 200 });
  } catch (error) {
    console.error('Error at PUT /brand-products');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
