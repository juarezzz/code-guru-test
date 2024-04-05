/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Functions ---------- */
import { delete_printer_user } from '_modules/users/functions/delete/delete-printer-user';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const { printer_id, printer_user_id } = queryStringParameters;

    if (!printer_id || !printer_user_id)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    await delete_printer_user({ printer_id, printer_user_id });

    return http_response({
      body: {
        message: 'Printer User deleted',
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /admin-printer-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
