/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import {
  ListGroupsCommand,
  ListGroupsCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [user_group] = cognito_groups;

    if (
      !roles?.[user_group]?.['admin-third-party-user-groups']?.includes('GET')
    )
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const params: ListGroupsCommandInput = {
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    };

    const list_groups_command = new ListGroupsCommand(params);

    const { Groups } = await cognito_client.send(list_groups_command);

    const third_party_groups = (Groups || []).map(group => ({
      group_name: group.GroupName,
      group_description: group.Description,
    }));

    return http_response({
      body: { third_party_groups },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /admin-third-party-user-groups');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
