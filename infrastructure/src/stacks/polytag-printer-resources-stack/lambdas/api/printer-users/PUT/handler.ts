/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { update_user_password } from '_modules/users/functions/update/update-user-password';

/* ---------- Schemas ---------- */
import { update_printer_user_schema } from '_modules/users/schemas/update-printer-user';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, body } = event;
    const { access_token } = headers;

    if (!access_token) {
      throw new Error(
        handle_http_error({
          status_code: 401,
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
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

    const { new_password, old_password } =
      await update_printer_user_schema.validate(JSON.parse(body));

    const promises: Promise<unknown>[] = [];

    if (access_token && new_password && old_password) {
      const change_user_password_promise = update_user_password({
        access_token,
        new_password,
        old_password,
      });

      promises.push(change_user_password_promise);
    }

    await Promise.all(promises);

    return http_response({
      body: { message: 'User updated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /printer-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
