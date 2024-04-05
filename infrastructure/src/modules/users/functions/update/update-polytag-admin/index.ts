/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { AdminUser } from '_modules/users/models/admin-user';

/* ---------- Interfaces ---------- */
interface UpdatePolytagAdminInput {
  cognito_group?: string;
  full_name?: string;
  user_sub: string;
}

/* ---------- Function ---------- */
const update_polytag_admin = async ({
  cognito_group,
  full_name,
  user_sub,
}: UpdatePolytagAdminInput) => {
  const update_expression = [
    full_name && `full_name = :full_name`,
    cognito_group && `cognito_group = :cognito_group`,
  ]
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<string, string | string[]> = {};

  if (full_name) expression_values[':full_name'] = full_name;
  if (cognito_group) expression_values[':cognito_group'] = cognito_group;

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `admin`,
      sort_key: `admin-user#${user_sub}`,
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return Attributes as AdminUser;
};

/* ---------- Export ---------- */
export { update_polytag_admin };
