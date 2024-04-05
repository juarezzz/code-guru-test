/* ---------- Types ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { send_forgot_password_email } from '_modules/users/functions/send/send-forgot-password-email';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { TEST_ALLOWED_EMAILS } from '_constants/test/allowed_emails';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.queryStringParameters || !event.queryStringParameters.email)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { email } = event.queryStringParameters;

    if (process.env.ENVIRONMENT?.toLowerCase() === 'test') {
      if (!TEST_ALLOWED_EMAILS.includes(email))
        throw new Error(
          handle_http_error({
            message: error_messages['invalid-email'].message,
            status_code: 400,
            code: error_messages['invalid-email'].code,
          }),
        );

      return http_response({
        body: { message: 'Code generated successfully.' },
        status_code: 200,
      });
    }

    await send_forgot_password_email({ email });

    return http_response({
      body: { message: 'Code generated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /forgot-password');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
