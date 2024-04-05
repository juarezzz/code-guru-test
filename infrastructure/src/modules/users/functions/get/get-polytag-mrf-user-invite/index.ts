/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { RCUserInvite } from '_modules/users/models/rc-user-invite';

/* ---------- Types ---------- */
interface GetRCPortalInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const get_polytag_mrf_user_invite = async ({
  email,
}: GetRCPortalInviteInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'filter-sk-index',
    KeyConditionExpression: '#filter = :filter',
    ExpressionAttributeNames: {
      '#filter': 'filter',
    },
    ExpressionAttributeValues: {
      ':filter': `mrf-invitation#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { rc_user_invite: null };

  return { rc_user_invite: Items[0] as RCUserInvite };
};

/* ---------- Export ---------- */
export { get_polytag_mrf_user_invite };
