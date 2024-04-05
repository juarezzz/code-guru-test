/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import {
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  AdminListGroupsForUserCommandInput,
  AdminListGroupsForUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminRemoveUserFromGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';
import { difference } from 'lodash';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Parsed {
  third_party_groups: string[];
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, queryStringParameters, headers } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
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

    const { third_party_id, third_party_user_id } = queryStringParameters;

    if (!third_party_id || !third_party_user_id)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-query-string'].code,
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups } = get_authenticated_user({
      token: id_token,
    });

    const [user_group] = cognito_groups;

    if (!roles?.[user_group]?.['admin-third-party-users']?.includes('PATCH'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { third_party_groups } = JSON.parse(body) as Parsed;

    if (!third_party_groups)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const get_groups_params: AdminListGroupsForUserCommandInput = {
      Username: third_party_user_id,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    };

    const get_groups_command = new AdminListGroupsForUserCommand(
      get_groups_params,
    );

    const { Groups } = await cognito_client.send(get_groups_command);

    const old_groups = Groups
      ? (Groups.map(group => group.GroupName).filter(Boolean) as string[])
      : [];

    const groups_to_add = difference(third_party_groups, old_groups);

    const groups_to_remove = difference(old_groups, third_party_groups);

    const remove_groups_promises = groups_to_remove.map(group_to_remove => {
      const params: AdminRemoveUserFromGroupCommandInput = {
        Username: third_party_user_id,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
        GroupName: group_to_remove,
      };

      const remove_from_group_command = new AdminRemoveUserFromGroupCommand(
        params,
      );

      return cognito_client.send(remove_from_group_command);
    });

    const add_groups_promises = groups_to_add.map(group_to_add => {
      const params: AdminAddUserToGroupCommandInput = {
        Username: third_party_user_id,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
        GroupName: group_to_add,
      };

      const add_to_group_command = new AdminAddUserToGroupCommand(params);

      return cognito_client.send(add_to_group_command);
    });

    const expression_values: Record<string, string | string[] | number> = {
      ':updated_at': new Date().getTime(),
      ':third_party_groups': third_party_groups,
    };

    const expression_names: Record<string, string> = {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    };

    const update_params: UpdateCommandInput = {
      TableName: process.env.TABLE_NAME,
      ConditionExpression:
        'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
      Key: {
        partition_key: `third-party#${third_party_id}`,
        sort_key: `third-party-user#${third_party_user_id}`,
      },
      UpdateExpression: `
        SET updated_at = :updated_at, third_party_groups = :third_party_groups
      `,
      ExpressionAttributeValues: {
        ...expression_values,
      },
      ExpressionAttributeNames: {
        ...expression_names,
      },
      ReturnValues: 'ALL_NEW',
    };

    const command = new UpdateCommand(update_params);

    const [{ Attributes }] = await Promise.all([
      dynamodb_documentclient.send(command),
      ...remove_groups_promises,
      ...add_groups_promises,
    ]);

    return http_response({
      body: { third_party_user: Attributes },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PATCH /admin-third-party-users');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
