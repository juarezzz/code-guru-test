/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Types ---------- */
import { Body } from '_stacks/polytag-brand-resources-stack/lambdas/api/user-attributes/PUT/@types';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, body } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, sub: user_sub } =
      get_authenticated_user({
        token: id_token,
      });

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { steps }: Body = JSON.parse(body);

    await update_user_onboarding_steps({
      brand_id,
      user_sub,
      action: 'add',
      steps,
    });

    return http_response({
      body: {
        steps,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /user-attributes');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
