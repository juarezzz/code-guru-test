/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

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

    const { headers } = event;

    /* ----------
     * We do like this so we can make the function work
     * both locally and live
     * ---------- */
    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': cognito_groups } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-brands']?.includes('GET') || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { brand } = await get_brand({
      brand_id,
    });

    if (!brand) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['brand-does-not-exist'].code,
          message: error_messages['brand-does-not-exist'].message,
        }),
      );
    }

    const transformed_brand = {
      ...brand,
      gcp_list: Array.from(brand.gcp_list || []),
    };

    return http_response({
      status_code: 200,
      body: { brand: transformed_brand },
    });
  } catch (error) {
    console.error('Error at GET /brand-brands');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
