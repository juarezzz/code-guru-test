/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { AdminInvite } from '_modules/users/models/admin-invite';

/* ---------- Types ---------- */
interface GetAdminInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const get_polytag_admin_invite = async ({ email }: GetAdminInviteInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': 'admin',
      ':sort_key': `admin-invite#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { admin_invite: null };

  return { admin_invite: Items[0] as AdminInvite };
};

/* ---------- Export ---------- */
export { get_polytag_admin_invite };
