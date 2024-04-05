/* ----------- External ----------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  TransactWriteCommand,
  TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

/* ----------- Types ----------- */
import { Build } from '__build/@types';

/* ----------- Helpers ----------- */
import { validate_gtin } from '_helpers/utils/validate-gtin';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { remove_leading_zeros } from '_helpers/utils/remove_leading_zeros';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ----------- Constants ----------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ----------- Modules ----------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { get_all_product_groups } from '_modules/product-groups/functions/get/get-all-product-groups';

/* ----------- Models ----------- */
import { Product } from '_modules/products/models';
import { ProductGroup } from '_modules/product-groups/models';

/* ----------- Clients ----------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ----------- Schemas ----------- */
import { batch_upload_schema } from '_modules/products/schemas/batch-upload';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  /* ---------- Controller ---------- */
  try {
    const { body, headers } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const {
      'custom:brand_id': brand_id,
      'custom:full_name': owner_name,
      'cognito:groups': cognito_groups,
    } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );
    }

    const [group] = cognito_groups;

    if (!roles[group]['brand-products'].includes('PUT')) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );
    }

    const { to_add, to_delete, to_update } = await batch_upload_schema.validate(
      JSON.parse(body),
    );

    if (!to_add && !to_delete && !to_update) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const operations_count =
      (to_add?.length || 0) +
      (to_delete?.length || 0) +
      (to_update?.length || 0);

    if (operations_count > 100) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['products-over-limit'].code,
          message: error_messages['products-over-limit'].message,
        }),
      );
    }

    const { brand } = await get_brand({ brand_id });

    if (!brand) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['brand-does-not-exist'].code,
          message: error_messages['brand-does-not-exist'].message,
        }),
      );
    }

    const invalid_gtin: string[] = [];
    const invalid_gcp: string[] = [];

    to_add?.forEach(product => {
      const valid_gtin = validate_gtin({
        gtin: product.gtin,
        environment:
          process.env.ENVIRONMENT?.toUpperCase() as Build.Environment,
      });

      if (!valid_gtin) invalid_gtin.push(product.gtin);

      const includes_gtin = Array.from(brand.gcp_list || []).some(gcp =>
        remove_leading_zeros(product.gtin).includes(remove_leading_zeros(gcp)),
      );

      if (!includes_gtin) invalid_gcp.push(product.gtin);
    });

    if (invalid_gtin.length !== 0 || invalid_gcp.length !== 0)
      return http_response({
        body: {
          message: 'Error validating your input.',
          invalid_gtin,
          invalid_gcp,
        },
        status_code: 400,
      });

    let last_key: string | undefined;
    const all_product_groups: ProductGroup[] = [];

    do {
      const { product_groups, last_evaluated_key } =
        await get_all_product_groups({ brand_id, last_key });

      all_product_groups.push(...product_groups);
      last_key = last_evaluated_key;
    } while (last_key);

    const created_products: Product[] = [];

    const product_item_add_requests: TransactWriteCommandInput['TransactItems'] =
      to_add?.map(product => {
        const current_product_group = all_product_groups.find(
          product_group =>
            product_group.product_group_name === product.product_group_name,
        );

        const product_item: Product = {
          ...product,
          attributes: product.attributes || [],
          components: product.components || [],
          product_description: product.product_description || '',
          partition_key: `brand#${brand_id}`,
          sort_key: `brand-product#${product.gtin}`,
          created_at: new Date().getTime(),
          created_by: owner_name,
          datatype: 'brand-product',
          product_group_sort_key: current_product_group?.sort_key,
          search: `brand-product#${product.product_name
            .replace(/\s/g, '_')
            .toLocaleLowerCase()}`,
          updated_at: new Date().getTime(),
        };

        created_products.push(product_item);

        return {
          Put: { TableName: process.env.TABLE_NAME, Item: product_item },
        };
      }) || [];

    const product_item_update_requests: TransactWriteCommandInput['TransactItems'] =
      to_update?.map(product => {
        const current_product_group = all_product_groups.find(
          product_group =>
            product_group.product_group_name === product.product_group_name,
        );

        const product_item: Product = {
          ...product,
          attributes: product.attributes || [],
          components: product.components || [],
          product_description: product.product_description || '',
          partition_key: `brand#${brand_id}`,
          sort_key: `brand-product#${product.gtin}`,
          created_by: owner_name,
          datatype: 'brand-product',
          created_at: product.created_at || new Date().getTime(),
          product_group_sort_key: current_product_group?.sort_key,
          search: `brand-product#${product.product_name
            .replace(/\s/g, '_')
            .toLocaleLowerCase()}`,
          updated_at: new Date().getTime(),
        };

        created_products.push(product_item);

        return {
          Put: { TableName: process.env.TABLE_NAME, Item: product_item },
        };
      }) || [];

    const product_item_delete_requests: TransactWriteCommandInput['TransactItems'] =
      to_delete?.map(gtin => ({
        Delete: {
          TableName: process.env.TABLE_NAME,
          Key: {
            partition_key: `brand#${brand_id}`,
            sort_key: `brand-product#${gtin}`,
          },
        },
      })) || [];

    const transact_items = [
      ...product_item_add_requests,
      ...product_item_update_requests,
      ...product_item_delete_requests,
    ];

    const params: TransactWriteCommandInput = {
      TransactItems: transact_items,
    };

    const command = new TransactWriteCommand(params);

    await dynamodb_documentclient.send(command);

    return http_response({
      body: {
        products: created_products,
        product_groups: all_product_groups,
      },
      status_code: 201,
    });
  } catch (error) {
    console.error('Error at POST /batch-upload');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
