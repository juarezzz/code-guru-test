/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import { AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Modules ---------- */
import { create_polytag_admin_cognito_group } from '_modules/users/functions/create/create-polytag-admin-cognito-group';
import { delete_polytag_admin_cognito_group } from '_modules/users/functions/delete/delete-polytag-admin-cognito-group';
import { update_polytag_admin } from '_modules/users/functions/update/update-polytag-admin';
import { cognito_client } from '_clients/cognito';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Body {
  cognito_group?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, body, headers } = event;

    if (!queryStringParameters || !queryStringParameters.user_sub)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    if (!headers?.access_token) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
        }),
      );
    }

    const { user_sub } = queryStringParameters;
    const parsed_body: Body = JSON.parse(body);

    const cognito_group = parsed_body.cognito_group;

    if (!cognito_group) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const list_user_groups_command = new AdminListGroupsForUserCommand({
      Username: user_sub,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    const target_user_groups = await cognito_client.send(
      list_user_groups_command,
    );

    const { email } = await update_polytag_admin({
      cognito_group,
      user_sub,
    });

    if (target_user_groups.Groups)
      await Promise.allSettled(
        target_user_groups.Groups.map(group =>
          delete_polytag_admin_cognito_group({
            cognito_group: group.GroupName || '',
            email,
          }),
        ),
      );

    await create_polytag_admin_cognito_group({
      cognito_group,
      email,
    });

    return http_response({
      body: { message: 'User updated successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /admin-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
