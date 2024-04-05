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
import { create_polytag_brand_invite } from '_modules/users/functions/create/create-polytag-brand-invite';
import { send_polytag_brand_invite_email } from '_modules/users/functions/send/send-polytag-brand-invite-email';
import { get_brand_invitation } from '_modules/brands/functions/get/get-brand-invitation';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  email: string;
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

    const id_token = headers.Authorization || headers.authorization;

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { 'cognito:groups': cognito_groups, sub } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles[group]['admin-brands'].includes('POST'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { email }: Body = JSON.parse(body);

    if (!email)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    /* ----------
     * Search if Email is already registered
     * ---------- */

    const email_found = await get_brand_invitation(email);

    if (email_found) {
      throw new Error(
        handle_http_error({
          code: error_messages['already-registered'].code,
          message: error_messages['already-registered'].message,
          status_code: 400,
        }),
      );
    }

    await Promise.all([
      create_polytag_brand_invite({ email, sub }),
      send_polytag_brand_invite_email({ email }),
    ]);

    return http_response({
      body: { message: 'Brand invitation sent successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-brands');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
