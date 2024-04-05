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

/* ---------- Modules ---------- */
import { get_all_printer_brand_associations } from '_modules/printer/functions/get/get-all-printer-brand-associations';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const {
      'cognito:groups': cognito_groups,
      'custom:printer_id': printer_id,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['printer-customers']?.includes('GET') ||
      !printer_id
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, associated_brands: customers } =
      await get_all_printer_brand_associations({
        printer_id,
        last_key,
      });

    return http_response({
      body: { customers, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /printer-customers');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
