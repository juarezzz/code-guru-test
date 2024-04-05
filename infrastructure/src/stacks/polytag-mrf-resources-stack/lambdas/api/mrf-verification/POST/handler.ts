/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { update_polytag_user_confirmation } from '_modules/users/functions/update/update-polytag-user-confirmation';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Body {
  email: string;
  code: string;
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

    const { email, code }: Body = JSON.parse(event.body);

    if (!email || !code) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    await update_polytag_user_confirmation({ email, code });

    return http_response({
      body: { message: 'User verified successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /mrf-verification');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
