/* ----------- External ----------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ----------- Helpers ----------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ----------- Modules ----------- */
import { get_brand_user_by_sub } from '_modules/users/functions/get/get-brand-user-by-sub';

/* ----------- Constants ----------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  /* ---------- Controller ---------- */
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

    const id_token = headers.Authorization || headers.authorization;

    const {
      'cognito:groups': cognito_groups,
      'custom:brand_id': brand_id,
      sub,
    } = get_authenticated_user({ token: id_token });

    const [group] = cognito_groups;

    if (!roles?.[group]?.users?.includes('GET') || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { user } = await get_brand_user_by_sub({ brand_id, sub });

    if (!user) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['user-does-not-exist'].code,
          message: error_messages['user-does-not-exist'].message,
        }),
      );
    }

    return http_response({
      body: { user },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
