/* ---------- Types ---------- */
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
import { send_forgot_password_email } from '_modules/users/functions/send/send-forgot-password-email';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.queryStringParameters?.email)
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
        }),
      );

    const { email } = event.queryStringParameters;

    await send_forgot_password_email({ email });

    return http_response({
      body: { message: 'Code generated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.log(error);
    return handle_http_error_response({ error });
  }
};
