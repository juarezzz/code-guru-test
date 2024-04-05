/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { update_password_confirmation } from '_modules/users/functions/update/update-password-confirmation';

/* ---------- Interfaces ---------- */
interface Body {
  email: string;
  code: string;
  password: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { email, code, password }: Body = JSON.parse(event.body);

    if (!email || !code || !password) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    await update_password_confirmation({
      email,
      code,
      password,
    });

    return http_response({
      body: { message: 'Password changed successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /admin-forgot-password');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
