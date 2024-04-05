/* -------------- Types -------------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { differenceBy } from 'lodash';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_polytag_admin_invite } from '_modules/users/functions/create/create-polytag-admin-invite';
import { send_polytag_admin_invite_email } from '_modules/users/functions/send/send-polytag-admin-invite-email';
import { get_all_polytag_admins } from '_modules/users/functions/get/get-all-polytag-admins';

/* ---------- Models ---------- */
import { AdminUser } from '_modules/users/models/admin-user';

/* ---------- Schemas ---------- */
import { create_admin_users_invite_schema } from '_modules/users/schemas/admin-user-invite';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { sub, 'cognito:groups': groups } = get_authenticated_user({
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

    const { users } = await create_admin_users_invite_schema.validate(
      JSON.parse(body),
    );

    if (!users?.length)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const user_with_super_admin_group = users.findIndex(
      u => u.cognito_group === 'polytag-super-admin',
    );

    if (
      !groups.includes('polytag-super-admin') &&
      user_with_super_admin_group !== -1
    )
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 400,
        }),
      );

    /* ----------
     * Search if Email is already registered
     * ---------- */

    let last_key: string | undefined;
    const all_admin_users: AdminUser[] = [];

    do {
      const { admins, last_evaluated_key } = await get_all_polytag_admins({
        last_key,
      });

      last_key = last_evaluated_key;

      all_admin_users.push(...admins);
    } while (last_key);

    const email_invitations = differenceBy(users, all_admin_users, 'email');

    if (!email_invitations.length) {
      throw new Error(
        handle_http_error({
          code: error_messages['already-registered'].code,
          message: error_messages['already-registered'].message,
          status_code: 400,
        }),
      );
    }

    const invite_promises = email_invitations.map(u => {
      return [
        create_polytag_admin_invite({
          email: u.email,
          cognito_group: u.cognito_group,
          sub,
        }),

        send_polytag_admin_invite_email({ email: u.email }),
      ];
    });

    await Promise.all(invite_promises.flat());

    return http_response({
      body: { message: 'Admin users were invited successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-invite');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
