/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterUserInvite } from '_modules/users/models/printer-invite';

/* ---------- Types ---------- */
interface GetInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const get_polytag_printer_user_invite = async ({ email }: GetInviteInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': 'admin',
      ':sort_key': `printer-user-invite#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { rc_user_invite: null };

  return { printer_user_invite: Items[0] as PrinterUserInvite };
};

/* ---------- Export ---------- */
export { get_polytag_printer_user_invite };
