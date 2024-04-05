/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { update_cron_settings } from '_modules/populate-cron/functions/update/update-populate-cron-settings';

/* ---------- Schemas ---------- */
import { update_populate_cron_settings } from '_modules/populate-cron/schemas';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const basic_token = headers.Authorization || headers.authorization;

    if (!basic_token)
      throw new Error(
        httpError({
          message: 'Authorization header is missing.',
          status_code: 400,
        }),
      );

    const base64 = basic_token.split(' ')[1];

    if (base64 !== process.env.WHITELIST)
      throw new Error(
        httpError({
          message: 'Authorization header is invalid.',
          status_code: 400,
        }),
      );

    if (!body)
      throw new Error(
        httpError({ message: 'Request body is missing.', status_code: 400 }),
      );

    const settings = await update_populate_cron_settings.validate(body);

    const cron_settings = update_cron_settings({ settings });

    return http_response({
      body: { cron_settings },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /populate-cron-settings');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
