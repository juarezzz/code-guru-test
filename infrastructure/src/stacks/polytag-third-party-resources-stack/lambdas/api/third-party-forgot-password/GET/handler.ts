/* ---------- Types ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';

/* ---------- Modules ---------- */
import { send_forgot_password_email } from '_modules/users/functions/send/send-forgot-password-email';

export const handler: APIGatewayProxyHandlerV2 = async (
  ev,
): Promise<APIGatewayProxyStructuredResultV2> =>
  log_lambda_metrics(ev, async event => {
    try {
      if (!event.queryStringParameters || !event.queryStringParameters.email)
        throw new Error(
          httpError({
            message: 'Missing query string parameters',
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
      console.error('Error at GET /third-party-forgot-password');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
