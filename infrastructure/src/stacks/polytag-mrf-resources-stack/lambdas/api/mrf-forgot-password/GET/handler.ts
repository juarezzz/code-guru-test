/* ---------- Types ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { send_forgot_password_email } from '_modules/users/functions/send/send-forgot-password-email';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Constants ---------- */

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.queryStringParameters || !event.queryStringParameters.email)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { email } = event.queryStringParameters;

    await send_forgot_password_email({ email });

    return http_response({
      body: { message: 'Code generated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /mrf-forgot-password');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
