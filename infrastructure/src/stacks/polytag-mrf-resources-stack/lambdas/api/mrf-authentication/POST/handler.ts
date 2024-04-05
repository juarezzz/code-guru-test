/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { create_mrf_user } from '_modules/users/functions/create/create-mrf-user';
import { get_polytag_mrf_user_invite } from '_modules/users/functions/get/get-polytag-mrf-user-invite';
import { delete_polytag_mrf_invite } from '_modules/users/functions/delete/delete-polytag-mrf-invite';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Body {
  email?: string;
  password?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body } = event;

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const parsed_body: Body = JSON.parse(body);

    const { email, password } = parsed_body;

    if (!email || !password) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { rc_user_invite } = await get_polytag_mrf_user_invite({
      email,
    });

    if (!rc_user_invite) {
      throw new Error(
        handle_http_error({
          code: error_messages['invite-not-received'].code,
          message: error_messages['invite-not-received'].message,
          status_code: 403,
        }),
      );
    }

    const { mrf_id, role } = rc_user_invite;

    await Promise.all([
      create_mrf_user({
        email,
        password,
        mrf_id,
        role,
      }),

      delete_polytag_mrf_invite({ email, mrf_id }),
    ]);

    return http_response({
      body: {
        message:
          'Account created successfully. Please, use your new credentials to login to the website.',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /mrf-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
