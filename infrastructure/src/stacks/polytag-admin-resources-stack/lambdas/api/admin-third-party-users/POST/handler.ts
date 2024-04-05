/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_third_party_user_by_email } from '_modules/users/functions/get/get-third-party-user-by-email';
import { create_third_party_user_invite } from '_modules/users/functions/create/create-third-party-user-invite';
import { send_third_party_user_invite_email } from '_modules/users/functions/send/send-third-party-user-invite-email';

/* ---------- Schemas ---------- */
import { create_third_party_users_invite_schema } from '_modules/users/schemas/third-party-user-invite';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { sub } = get_authenticated_user({
      token: id_token,
    });

    if (!body) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    const { email, third_party_id, third_party_groups } =
      await create_third_party_users_invite_schema.validate(JSON.parse(body));

    /* ----------
     * Search if Email is already registered
     * ---------- */

    const user_found = await get_third_party_user_by_email(email);

    if (user_found.length) {
      throw new Error(
        handle_http_error({
          code: error_messages['already-registered'].code,
          message: error_messages['already-registered'].message,
          status_code: 400,
        }),
      );
    }

    await create_third_party_user_invite({
      email,
      sub,
      third_party_id,
      third_party_groups,
    });

    await send_third_party_user_invite_email({ email });

    return http_response({
      body: { message: 'Third party user invitation sent successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-third-party-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
