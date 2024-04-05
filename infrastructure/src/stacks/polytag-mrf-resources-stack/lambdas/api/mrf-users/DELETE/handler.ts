/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { delete_mrf_user } from '_modules/users/functions/delete/delete-mrf-user';

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

    const { 'cognito:groups': cognito_groups, 'custom:mrf_id': mrf_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['mrf-users']?.includes('DELETE') || !mrf_id) {
      throw new Error(
        handle_http_error({
          code: error_messages['403'].code,
          message: error_messages['403'].message,
          status_code: 401,
        }),
      );
    }

    if (!queryStringParameters?.user_sub) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );
    }

    const { user_sub: mrf_user_id } = queryStringParameters;

    await delete_mrf_user({
      mrf_id,
      mrf_user_id,
    });

    return http_response({
      body: { message: 'User deleted successfully' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at DELETE /mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
