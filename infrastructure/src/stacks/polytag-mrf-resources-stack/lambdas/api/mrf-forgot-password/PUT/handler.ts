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

/* ---------- Schemas ---------- */
import { forgot_password_params_schema } from '_modules/users/schemas/forgot-password';

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

    const { email, code, password } =
      await forgot_password_params_schema.validate(JSON.parse(event.body));

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
    return handle_http_error_response({ error });
  }
};
