/* ---------- External ---------- */
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  AdminAddUserToGroupCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Models ---------- */
import { BrandUserRole, BrandUserStatus } from '_modules/users/models/user';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface Body {
  user_sub: string;
  role?: BrandUserRole;
  status?: BrandUserStatus;
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

/* ---------- Constants ---------- */
const ALLOWED_STATUSES = ['ACTIVE', 'LOCKED'];
const ALLOWED_ROLES = ['mrf-admin', 'mrf-viewer'];

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:mrf_id': mrf_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['mrf-users']?.includes('PUT') || !mrf_id) {
      throw new Error(
        handle_http_error({
          code: error_messages['403'].code,
          message: error_messages['403'].message,
          status_code: 401,
        }),
      );
    }

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { user_sub, role, status }: Body = JSON.parse(body);

    if (
      !user_sub ||
      (role && !ALLOWED_ROLES.includes(role)) ||
      (status && !ALLOWED_STATUSES.includes(status))
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    const promises: Promise<unknown>[] = [];

    const update_expr_attr: string[] = [];
    const update_expr_names: Record<string, string> = {};
    const update_expr_values: Record<string, unknown> = {};

    if (role) {
      update_expr_attr.push('role');
      update_expr_names['#role'] = 'role';
      update_expr_values[':role'] = role;

      const list_user_groups_command = new AdminListGroupsForUserCommand({
        Username: user_sub,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
      });

      const user_groups = await cognito_client.send(list_user_groups_command);

      const user_already_in_group = user_groups.Groups?.find(
        ({ GroupName }) => GroupName === role,
      );

      if (!user_already_in_group) {
        const add_user_to_group_command = new AdminAddUserToGroupCommand({
          GroupName: role,
          Username: user_sub,
          UserPoolId: process.env.COGNITO_USERPOOL_ID,
        });

        promises.push(cognito_client.send(add_user_to_group_command));

        const remove_from_group_promises =
          user_groups.Groups?.map(({ GroupName }) => {
            const remove_command = new AdminRemoveUserFromGroupCommand({
              GroupName,
              Username: user_sub,
              UserPoolId: process.env.COGNITO_USERPOOL_ID,
            });

            return cognito_client.send(remove_command);
          }) || [];

        promises.push(...remove_from_group_promises);
      }
    }

    if (status) {
      update_expr_attr.push('status');
      update_expr_names['#status'] = 'status';
      update_expr_values[':status'] = status;

      switch (status) {
        case 'ACTIVE': {
          const enable_user_command = new AdminEnableUserCommand({
            Username: user_sub,
            UserPoolId: process.env.COGNITO_USERPOOL_ID,
          });

          promises.push(cognito_client.send(enable_user_command));

          break;
        }

        case 'LOCKED': {
          const disable_user_command = new AdminDisableUserCommand({
            Username: user_sub,
            UserPoolId: process.env.COGNITO_USERPOOL_ID,
          });

          promises.push(cognito_client.send(disable_user_command));

          break;
        }

        default:
          break;
      }
    }

    const update_expr_parts: string[] = update_expr_attr.map(
      attr => `#${attr} = :${attr}`,
    );

    const update_expr: string | undefined = update_expr_attr.length
      ? `SET ${update_expr_parts.join(', ')}`
      : undefined;

    const update_command = new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      ReturnValues: 'ALL_NEW',
      Key: {
        partition_key: `mrf#${mrf_id}`,
        sort_key: `mrf-user#${user_sub}`,
      },
      UpdateExpression: update_expr,

      ExpressionAttributeNames: update_expr_attr.length
        ? update_expr_names
        : undefined,

      ExpressionAttributeValues: update_expr_attr.length
        ? update_expr_values
        : undefined,
    });

    const [{ Attributes: mrf_user }] = await Promise.all([
      dynamodb_documentclient.send(update_command),
      ...promises,
    ]);

    return http_response({
      body: { mrf_user },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /mrf-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
