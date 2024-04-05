/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { MRFUser } from '_modules/users/models/mrf-user';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllMRFUsersInput {
  mrf_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_mrf_users = async ({ mrf_id, last_key }: GetAllMRFUsersInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'mrf-user',
    partition_key: `mrf#${mrf_id}`,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'mrf-user',
      ':partition_key': `mrf#${mrf_id}`,
    },
    ExclusiveStartKey: exclusive_start_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  const last_evaluated_key = encode_last_key({
    last_evaluated_key: LastEvaluatedKey,
    preserve: ['sort_key'],
  });

  return {
    mrf_users: Items as MRFUser[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_mrf_users };
