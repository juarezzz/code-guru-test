/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_printer_user_invite } from '_modules/users/functions/create/create-printer-user-invite';
import { send_printer_user_invite_email } from '_modules/users/functions/send/send-printer-user-invite-email';
import { get_printer_user_by_email } from '_modules/users/functions/get/get-printer-user-by-email';

/* ---------- Schemas ---------- */
import { create_printer_user_invite_schema } from '_modules/users/schemas/printer-user-invite';

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

    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, sub } = get_authenticated_user({
      token: id_token,
    });

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const [group] = cognito_groups;

    if (!roles?.[group]?.['admin-printer-users']?.includes('POST'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { email, printer_id } =
      await create_printer_user_invite_schema.validate(JSON.parse(body));

    /* ----------
     * Search if Email is already registered
     * ---------- */

    const user_found = await get_printer_user_by_email(email);

    if (user_found.length) {
      throw new Error(
        handle_http_error({
          code: error_messages['already-registered'].code,
          message: error_messages['already-registered'].message,
          status_code: 400,
        }),
      );
    }

    await create_printer_user_invite({
      email,
      sub,
      printer_id,
    });

    await send_printer_user_invite_email({ email });

    return http_response({
      body: { message: 'Printer user invitation sent successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /admin-printer-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
