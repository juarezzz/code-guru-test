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
import { update_polytag_user_confirmation } from '_modules/users/functions/update/update-polytag-user-confirmation';

/* ---------- Interfaces ---------- */
interface Body {
  email: string;
  code: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  ev,
): Promise<APIGatewayProxyStructuredResultV2> =>
  log_lambda_metrics(ev, async event => {
    try {
      if (!event.body)
        throw new Error(
          httpError({ message: 'Missing body.', status_code: 400 }),
        );

      const { email, code }: Body = JSON.parse(event.body);

      if (!email || !code)
        throw new Error(
          httpError({ message: 'Missing required fields.', status_code: 400 }),
        );

      await update_polytag_user_confirmation({ email, code });

      return http_response({
        body: { message: 'User verified successfully.' },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at POST /third-party-verification');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
