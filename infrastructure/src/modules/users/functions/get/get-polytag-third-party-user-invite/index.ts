/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ThirdPartyUserInvite } from '_modules/users/models/third-party-invite';

/* ---------- Types ---------- */
interface GetRCPortalInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const get_polytag_third_party_user_invite = async ({
  email,
}: GetRCPortalInviteInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': 'admin',
      ':sort_key': `third-party-user-invite#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { rc_user_invite: null };

  return { third_party_user_invite: Items[0] as ThirdPartyUserInvite };
};

/* ---------- Export ---------- */
export { get_polytag_third_party_user_invite };
