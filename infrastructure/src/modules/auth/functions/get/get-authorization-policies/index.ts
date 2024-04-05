/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Policy } from '_modules/auth/models';

/* ---------- Types ---------- */
import { GetAuthorizationPoliciesInput } from '_modules/auth/functions/get/get-authorization-policies/@types';

/* ---------- Function ---------- */
const get_authorization_policies = async ({
  group,
}: GetAuthorizationPoliciesInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': group,
      ':sort_key': 'policies',
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { policies: null };

  return { policies: Items[0] as Policy };
};

/* ---------- Export ---------- */
export { get_authorization_policies };
