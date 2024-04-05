/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllMrfsInput {
  last_key?: string;
}

const get_all_mrfs = async ({ last_key }: GetAllMrfsInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'mrf',
    sort_key: 'mrf',
    partition_key: decoded_last_key.partition_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression: 'datatype = :datatype',
    ExpressionAttributeValues: {
      ':datatype': 'mrf',
    },
    ExclusiveStartKey: exclusive_start_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  const last_evaluated_key = encode_last_key({
    last_evaluated_key: LastEvaluatedKey,
    preserve: ['partition_key'],
  });

  return { mrfs: Items as Mrf[], last_evaluated_key };
};

/* ---------- Export ---------- */
export { get_all_mrfs };
