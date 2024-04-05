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
import { create_printer_user } from '_modules/users/functions/create/create-printer-user';
import { get_polytag_printer_user_invite } from '_modules/users/functions/get/get-polytag-printer-user-invite';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

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

    const { email, password } = JSON.parse(body);

    if (!email || !password) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { printer_user_invite } = await get_polytag_printer_user_invite({
      email,
    });

    if (!printer_user_invite) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['invite-not-received'].code,
          message: error_messages['invite-not-received'].message,
        }),
      );
    }

    const { printer_id, created_by } = printer_user_invite;

    await create_printer_user({
      email,
      password,
      printer_id,
      created_by,
    });

    return http_response({
      body: {
        message:
          'Account created successfully. Please, use your new credentials to login to the website.',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /printer-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
