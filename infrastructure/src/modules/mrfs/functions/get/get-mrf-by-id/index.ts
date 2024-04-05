/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

/* ---------- Interfaces ---------- */
interface GetMrfByID {
  mrf_id: string;
}

const get_mrf_by_id = async ({ mrf_id }: GetMrfByID) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key and sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':sort_key': 'mrf',
      ':partition_key': `mrf#${mrf_id}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { mrf: null };

  const mrf = Items[0] as Mrf;

  return { mrf };
};

/* ---------- Export ---------- */
export { get_mrf_by_id };
