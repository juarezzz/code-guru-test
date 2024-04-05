/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { Utils } from 'digital-link.js';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { check_if_gcp_contains_gtin } from '_helpers/utils/check-if-gcp-contains-gtin';

/* ---------- Schemas ---------- */
import { create_product_schema } from '_modules/products/schemas';

/* ---------- Models ---------- */
import { Attributes, Components, Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { create_product } from '_modules/products/functions/create/create-product';
import { create_product_group } from '_modules/product-groups/functions/create/create-product-group';
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { get_product_group_by_name } from '_modules/product-groups/functions/get/get-product-group-by-name';
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  attributes: Attributes[];
  components: Components[];
  gtin: string;
  product_description: string;
  product_group_name?: string;
  product_name: string;
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

    const gtin_rule = Utils.Rules.gtin;

    const { body, headers, queryStringParameters } = event;

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
      'custom:brand_id': brand_id,
      'custom:full_name': owner_name,
      'cognito:groups': cognito_groups,
      sub: owner_sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-products']?.includes('POST'))
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
     * Create a product based on JSON body
     * ---------- */
    const product_input: Body = JSON.parse(body);

    await create_product_schema.validate(product_input);

    const { gtin } = product_input;

    if (!Utils.testRule(gtin_rule, gtin))
      throw new Error(
        handle_http_error({
          code: error_messages['invalid-gtin'].code,
          message: error_messages['invalid-gtin'].message,
          status_code: 400,
        }),
      );

    /* ----------
     * Check Brand GCP list
     * ---------- */
    const { brand } = await get_brand({ brand_id });

    if (!brand)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (
      !Array.from(brand.gcp_list || []).some(gcp =>
        check_if_gcp_contains_gtin({ gcp, gtin }),
      )
    )
      throw new Error(
        handle_http_error({
          code: error_messages['invalid-gtin-array'].code,
          message: error_messages['invalid-gtin-array'].message,
          status_code: 400,
        }),
      );

    const product_payload = {
      created_by: owner_sub,
      brand_id,
      product_group_sort_key: '',
      product_input,
    };

    /* ----------
     * Create a product group if it doesn't exist
     * ---------- */
    if (product_input.product_group_name) {
      let product_group = await get_product_group_by_name({
        brand_id,
        product_group_name: product_input.product_group_name,
      });

      if (product_group) {
        product_payload.product_group_sort_key = product_group.sort_key;
      } else {
        product_group = await create_product_group({
          brand_id,
          owner_name,
          owner_sub,
          product_group_name: product_input.product_group_name,
        });

        product_payload.product_group_sort_key = product_group.sort_key;
      }
    }

    let product: Product;

    try {
      product = await create_product(product_payload);
    } catch (e) {
      if ((e as Error).name === 'ConditionalCheckFailedException') {
        throw new Error(
          handle_http_error({
            code: error_messages['gtin-already-in-use'].code,
            message: error_messages['gtin-already-in-use'].message,
            status_code: 400,
          }),
        );
      }
      throw e;
    }

    /* ----------
     * Set getting started steps
     * if it comes from onboarding
     * ---------- */
    if (queryStringParameters && queryStringParameters.onboarding)
      await update_user_onboarding_steps({
        brand_id,
        user_sub: owner_sub,
        action: 'add',
        steps: ['upload_products'],
      });

    return http_response({ body: { product }, status_code: 200 });
  } catch (error) {
    console.error('Error at POST /brand-products');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
