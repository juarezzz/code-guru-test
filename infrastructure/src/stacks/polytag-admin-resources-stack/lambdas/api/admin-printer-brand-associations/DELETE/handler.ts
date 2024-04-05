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
import { delete_printer_brand_association } from '_modules/printer/functions/delete/delete-printer-brand-association';

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

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['admin-printer-brand-associations']?.includes('DELETE')
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    if (
      !queryStringParameters?.brand_id ||
      !queryStringParameters?.printer_id
    ) {
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );
    }

    const { printer_id, brand_id } = queryStringParameters;

    const { brand_association } = await delete_printer_brand_association({
      printer_id,
      brand_id,
    });

    return http_response({
      body: { brand_association },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /admin-printer-brand-associations');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
