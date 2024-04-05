/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- COnstants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { create_polytag_verification_code } from '_modules/users/functions/create/create-polytag-verification-code';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    if (!event.queryStringParameters?.email) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );
    }

    const { email } = event.queryStringParameters;

    await create_polytag_verification_code({ email });

    return http_response({
      body: { message: 'Verification code sent to email.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-verification');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
