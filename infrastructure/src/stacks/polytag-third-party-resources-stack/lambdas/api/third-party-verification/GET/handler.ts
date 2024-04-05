/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { httpError } from '_helpers/errors/httpError';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';

/* ---------- Modules ---------- */
import { create_polytag_verification_code } from '_modules/users/functions/create/create-polytag-verification-code';

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

      await create_polytag_verification_code({ email });

      return http_response({
        body: { message: 'Verification code sent to email.' },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at GET /third-party-verification');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
