/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';

/* ---------- Modules ---------- */
import { get_polytag_third_party_user_invite } from '_modules/users/functions/get/get-polytag-third-party-user-invite';
import { create_third_party_user } from '_modules/users/functions/create/create-third-party-user';

export const handler: APIGatewayProxyHandlerV2 = async (
  ev,
): Promise<APIGatewayProxyStructuredResultV2> =>
  log_lambda_metrics(ev, async event => {
    try {
      const { body } = event;

      if (!body)
        throw new Error(
          httpError({ message: 'Request body is missing.', status_code: 400 }),
        );

      const { email, password } = JSON.parse(body);

      if (!email || !password)
        throw new Error(
          httpError({
            message: 'Body is missing required fields.',
            status_code: 400,
          }),
        );

      const { third_party_user_invite } =
        await get_polytag_third_party_user_invite({
          email,
        });

      if (!third_party_user_invite)
        throw new Error(
          httpError({
            message: 'E-mail address did not receive an invitation.',
            status_code: 403,
          }),
        );

      const { third_party_id, third_party_groups, created_by } =
        third_party_user_invite;

      await create_third_party_user({
        email,
        password,
        third_party_id,
        third_party_groups,
        created_by,
      });

      return http_response({
        body: {
          message:
            'Account created successfully. Please, use your new credentials to login to the website.',
        },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at POST /third-party-authentication');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
