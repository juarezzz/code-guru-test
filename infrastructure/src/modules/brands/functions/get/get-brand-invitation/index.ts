/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandUserInvite } from '_modules/users/models/brand-invite';

const get_brand_invitation = async (
  email: string,
): Promise<BrandUserInvite | null> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'filter-sk-index',
    KeyConditionExpression: '#filter = :filter',
    ExpressionAttributeNames: {
      '#filter': 'filter',
    },
    ExpressionAttributeValues: {
      ':filter': `brand-invitation#${email}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return null;

  return Items[0] as BrandUserInvite;
};

export { get_brand_invitation };
