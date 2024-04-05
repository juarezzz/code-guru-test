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
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { create_printer_brand_association } from '_modules/printer/functions/create/create-printer-brand-association';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  brand_id: string;
  printer_id: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['admin-printer-brand-associations']?.includes('PUT')
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    if (!body) {
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );
    }

    const parsed_body: Body = JSON.parse(body);

    const brand_id = parsed_body.brand_id;
    const printer_id = parsed_body.printer_id;

    if (!brand_id || !printer_id) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { brand: brand_info } = await get_brand({ brand_id });

    if (!brand_info) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['brand-does-not-exist'].code,
          message: error_messages['brand-does-not-exist'].message,
        }),
      );
    }

    const { brand_association } = await create_printer_brand_association({
      brand_id,
      printer_id,
      brand_name: brand_info.brand_name,
    });

    return http_response({
      body: { brand_association },
      status_code: 201,
    });
  } catch (error) {
    console.error('Error at PUT /admin-printer-brand-associations');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
