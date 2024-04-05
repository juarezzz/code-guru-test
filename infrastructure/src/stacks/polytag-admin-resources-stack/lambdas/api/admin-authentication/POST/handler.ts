/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { create_polytag_admin } from '_modules/users/functions/create/create-polytag-admin';
import { get_polytag_admin_invite } from '_modules/users/functions/get/get-polytag-admin-invite';
import { delete_polytag_admin_invite } from '_modules/users/functions/delete/delete-polytag-admin-invite';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { email, password } = JSON.parse(body);

    if (!email || !password)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { admin_invite } = await get_polytag_admin_invite({
      email,
    });

    if (!admin_invite)
      throw new Error(
        handle_http_error({
          code: error_messages['invite-not-received'].code,
          message: error_messages['invite-not-received'].message,
          status_code: 403,
        }),
      );

    const { cognito_group } = admin_invite;

    await create_polytag_admin({
      email,
      password,
      group: cognito_group,
    });

    await delete_polytag_admin_invite({ email });

    return http_response({
      body: {
        message:
          'Account created successfully. Please, use your new credentials to login to the website.',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
