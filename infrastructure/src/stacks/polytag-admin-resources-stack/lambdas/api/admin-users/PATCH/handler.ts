/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { update_polytag_admin } from '_modules/users/functions/update/update-polytag-admin';
import { update_polytag_admin_attributes } from '_modules/users/functions/update/update-polytag-admin-attributes';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Body {
  full_name?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, body, headers } = event;

    if (!queryStringParameters?.user_sub)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    if (!headers?.access_token) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
        }),
      );
    }

    const { access_token } = headers;
    const { user_sub } = queryStringParameters;
    const parsed_body: Body = JSON.parse(body);

    const full_name = parsed_body.full_name;

    if (!full_name) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    await update_polytag_admin({
      full_name,
      user_sub,
    });

    await update_polytag_admin_attributes({
      access_token,
      full_name,
    });

    return http_response({
      body: { message: 'User updated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PATCH /admin-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
