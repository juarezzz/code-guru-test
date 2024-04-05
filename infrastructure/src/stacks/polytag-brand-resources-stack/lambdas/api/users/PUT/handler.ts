/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { AttributeType } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { update_user_password } from '_modules/users/functions/update/update-user-password';
import { update_brand_user_attributes } from '_modules/users/functions/update/update-brand-user-attributes';
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';

/* ---------- Interfaces ---------- */
interface Body {
  name?: string;
  job_title?: string;
  old_password?: string;
  new_password?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, body } = event;
    const { access_token } = headers;

    if (!access_token) {
      throw new Error(
        handle_http_error({
          status_code: 401,
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
        }),
      );
    }

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { name, job_title, new_password, old_password }: Body =
      JSON.parse(body);

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, sub } = get_authenticated_user({
      token: id_token,
    });

    const promises: Promise<unknown>[] = [];
    const attributes: AttributeType[] = [];

    if (name) attributes.push({ Name: 'custom:full_name', Value: name });

    if (job_title) {
      attributes.push({ Name: 'custom:job_title', Value: job_title });
    }

    if (attributes.length) {
      promises.push(
        update_brand_user_attributes({
          brand_id,
          attributes,
          access_token,
          user_sub: sub,
          update_dynamo: !!brand_id,
        }),
      );
    }

    if (brand_id && sub) {
      const update_user_attributes_promise = update_user_onboarding_steps({
        action: 'add',
        brand_id,
        steps: ['create_brand'],
        user_sub: sub,
      });

      promises.push(update_user_attributes_promise);
    }

    if (access_token && new_password && old_password) {
      const change_user_password_promise = update_user_password({
        access_token,
        new_password,
        old_password,
      });

      promises.push(change_user_password_promise);
    }

    await Promise.all(promises);

    return http_response({
      body: { message: 'User updated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
