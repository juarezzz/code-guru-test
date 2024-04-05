/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandUserInvite } from '_modules/users/models/brand-invite';

/* ---------- Types ---------- */
interface GetPolytagBrandUserInviteInput {
  email: string;
}

/* ---------- Function ---------- */
const get_polytag_brand_user_invite = async ({
  email,
}: GetPolytagBrandUserInviteInput) => {
  const params: QueryCommandInput = {
    Limit: 1,
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression: 'datatype = :datatype AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-invite',
      ':sort_key': `brand-invite#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items?.[0]) return { brand_user_invite: undefined };

  return { brand_user_invite: Items[0] as BrandUserInvite };
};

/* ---------- Export ---------- */
export { get_polytag_brand_user_invite };
