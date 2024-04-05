/* ----------- External ----------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  TransactWriteCommand,
  TransactWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ----------- Helpers ----------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ----------- Constants ----------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ----------- Modules ----------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';

/* ----------- Models ----------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ----------- Clients ----------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ----------- Types ----------- */
interface Body {
  product_groups: string[];
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  /* ---------- Controller ---------- */
  try {
    const { body, headers } = event;

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const id_token = headers.Authorization || headers.authorization;

    const {
      'custom:brand_id': brand_id,
      'custom:full_name': owner_name,
      'cognito:groups': cognito_groups,
      sub: owner_sub,
    } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 401,
        }),
      );
    }

    const [group] = cognito_groups;

    if (!roles[group]['brand-product-groups'].includes('POST')) {
      throw new Error(
        handle_http_error({
          status_code: 401,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );
    }

    const { product_groups } = JSON.parse(body) as Body;

    if (!product_groups) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    if (product_groups.length > 100) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['product-groups-over-limit'].code,
          message: error_messages['product-groups-over-limit'].message,
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

    const created_product_groups: ProductGroup[] = [];

    const product_group_item_add_requests: TransactWriteCommandInput['TransactItems'] =
      product_groups.map(product_group_name => {
        const product_group_item = {
          partition_key: `brand#${brand_id}`,
          sort_key: `brand-product-group#${uuidv4()}`,
          datatype: 'brand-product-group',
          search: `brand-product-group#${product_group_name
            .replace(/\s/g, '_')
            .toLocaleLowerCase()}`,
          product_group_name,
          products_count: 0,
          owner_name,
          owner_sub,
          created_at: new Date().getTime(),
          updated_at: new Date().getTime(),
          created_by: owner_sub,
        };

        created_product_groups.push(product_group_item);

        return {
          Put: { TableName: process.env.TABLE_NAME, Item: product_group_item },
        };
      });

    const params: TransactWriteCommandInput = {
      TransactItems: product_group_item_add_requests,
    };

    const command = new TransactWriteCommand(params);

    await dynamodb_documentclient.send(command);

    return http_response({
      body: {
        product_groups: created_product_groups,
      },
      status_code: 201,
    });
  } catch (error) {
    console.error('Error at POST /batch-upload');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
