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
import { get_all_product_groups } from '_modules/product-groups/functions/get/get-all-product-groups';
import { get_all_product_groups_by_name } from '_modules/product-groups/functions/get/get-all-product-groups-by-name';

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

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': cognito_groups } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-product-groups']?.includes('GET'))
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
    if (queryStringParameters && queryStringParameters.product_group_id) {
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
    if (queryStringParameters?.product_group_name) {
      const { product_groups } = await get_all_product_groups_by_name({
        brand_id,
        product_group_name: queryStringParameters.product_group_name,
      });

      return http_response({
        body: { product_groups, last_evaluated_key: undefined },
        status_code: 200,
      });
    }

    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, product_groups } = await get_all_product_groups(
      {
        brand_id,
        last_key,
      },
    );

    return http_response({
      body: { product_groups, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /brand-product-groups');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
