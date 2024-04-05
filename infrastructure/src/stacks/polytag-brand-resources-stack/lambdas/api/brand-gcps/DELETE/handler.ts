/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Modules ---------- */
import { remove_gcps_from_brand } from '_modules/brands/functions/delete/remove-gcps-from-brand';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-domains']?.includes('DELETE') || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const gcps_to_delete: string[] = JSON.parse(
      queryStringParameters?.gcps || '[]',
    );

    if (!Array.isArray(gcps_to_delete) || !gcps_to_delete.length)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { brand_gcps } = await remove_gcps_from_brand({
      brand_id,
      gcps: gcps_to_delete,
    });

    return http_response({
      status_code: 200,
      body: { brand_gcps },
    });
  } catch (error) {
    console.error('Error at DELETE /brand-gcps');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
