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
import { get_all_mrf_users } from '_modules/users/functions/get/get-all-mrf-users';

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

    if (!roles?.[group]?.['mrf-users']?.includes('GET') || !mrf_id) {
      throw new Error(
        handle_http_error({
          code: error_messages['403'].code,
          message: error_messages['403'].message,
          status_code: 401,
        }),
      );
    }

    const last_key = queryStringParameters?.last_key;

    const { last_evaluated_key, mrf_users } = await get_all_mrf_users({
      mrf_id,
      last_evaluated_key: last_key ? JSON.parse(last_key) : undefined,
    });

    return http_response({
      body: { mrf_users, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
