/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { differenceBy } from 'lodash';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { send_mrf_user_invite_email } from '_modules/users/functions/send/send-mrf-user-invite-email';
import { create_mrf_user_invite } from '_modules/users/functions/create/create-mrf-user-invite';
import { get_polytag_mrf_user_invite } from '_modules/users/functions/get/get-polytag-mrf-user-invite';

/* ---------- Schemas ---------- */
import { create_multiple_mrf_user_invites_schema } from '_modules/users/schemas/mrf-user-invite';

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;
    const { access_token } = headers;

    if (!access_token) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
          status_code: 401,
        }),
      );
    }

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:mrf_id': mrf_id, sub } = get_authenticated_user({
      token: id_token,
    });

    if (!mrf_id) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { users } = await create_multiple_mrf_user_invites_schema.validate(
      JSON.parse(body),
    );

    const mrf_emails_promises = users.map(({ email }) =>
      get_polytag_mrf_user_invite({ email }),
    );

    const mrf_emails = await Promise.all(mrf_emails_promises);

    const already_invited_emails = mrf_emails
      .map(({ rc_user_invite }) => ({
        email: rc_user_invite?.email,
      }))
      .filter(({ email }) => Boolean(email));

    const users_to_invite = differenceBy(
      users,
      already_invited_emails,
      'email',
    );

    if (!users_to_invite.length) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['email-already-invited'].code,
          message: error_messages['email-already-invited'].message,
        }),
      );
    }

    const invite_promises = users_to_invite.map(({ email, role }) => {
      return [
        create_mrf_user_invite({
          mrf_id,
          email,
          sub,
          role,
        }),

        send_mrf_user_invite_email({ email }),
      ];
    });

    await Promise.all(invite_promises.flat());

    return http_response({
      body: {
        message: 'Users invited successfully',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /mrf-invitation');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
