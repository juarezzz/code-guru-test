/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { User } from '_modules/users/models/user';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllBrandUsersInput {
  brand_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_brand_users = async ({
  brand_id,
  last_key,
}: GetAllBrandUsersInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'brand-account',
    partition_key: `brand#${brand_id}`,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-account',
      ':partition_key': `brand#${brand_id}`,
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
    brand_users: Items as User[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_brand_users };
