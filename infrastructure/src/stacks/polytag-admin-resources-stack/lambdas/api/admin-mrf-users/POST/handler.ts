/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_mrf_by_id } from '_modules/mrfs/functions/get/get-mrf-by-id';
import { create_mrf_user_invite } from '_modules/users/functions/create/create-mrf-user-invite';
import { send_mrf_user_invite_email } from '_modules/users/functions/send/send-mrf-user-invite-email';
import { get_polytag_mrf_user_invite } from '_modules/users/functions/get/get-polytag-mrf-user-invite';

/* ---------- Schemas ---------- */
import { create_mrf_user_invite_schema } from '_modules/users/schemas/mrf-user-invite';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { sub } = get_authenticated_user({
      token: id_token,
    });

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { email, mrf_id } = await create_mrf_user_invite_schema.validate(
      JSON.parse(body),
    );

    if (!email || !mrf_id)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { mrf } = await get_mrf_by_id({ mrf_id });

    if (!mrf)
      throw new Error(
        handle_http_error({
          code: error_messages['mrf-does-not-exist'].code,
          message: error_messages['mrf-does-not-exist'].message,
          status_code: 404,
        }),
      );

    /* ----------
     * Search if Email is already registered
     * ---------- */

    const { rc_user_invite: user_found } = await get_polytag_mrf_user_invite({
      email,
    });

    if (user_found) {
      throw new Error(
        handle_http_error({
          code: error_messages['already-registered'].code,
          message: error_messages['already-registered'].message,
          status_code: 400,
        }),
      );
    }

    await create_mrf_user_invite({ email, sub, mrf_id, role: 'mrf-admin' });

    await send_mrf_user_invite_email({ email });

    return http_response({
      body: { message: 'MRF user invitation sent successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
