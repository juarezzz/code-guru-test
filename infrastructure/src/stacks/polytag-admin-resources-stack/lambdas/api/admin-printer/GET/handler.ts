/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Clients ---------- */
import { get_all_printers } from '_modules/printer/functions/get/get-all-printers';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    /* ----------
     * That's responsible for keeping the Lambda warm
     * and it returns just in case the event is from a scheduled cron.
     * ---------- */
    if (event.source && event.source === 'aws.events') {
      console.log('Keeping the lambda warm.');

      return http_response({
        body: { message: 'Getting warm.' },
        status_code: 200,
      });
    }

    const { queryStringParameters, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['admin-printer']?.includes('GET'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters && queryStringParameters.printer_id) {
      throw new Error(
        handle_http_error({
          message: 'Not implemented',
          status_code: 400,
          code: '000',
        }),
      );

      //
      // Implement GET endpoint
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, printers } = await get_all_printers({
      last_key,
    });

    return http_response({
      body: { printers, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-printer');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
