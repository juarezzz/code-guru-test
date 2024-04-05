/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { AdminUser } from '_modules/users/models/admin-user';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';
import { ConditionalOperator, Select } from '@aws-sdk/client-dynamodb';

/* ---------- Interfaces ---------- */
interface GetAllPolytagAdminsInput {
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_polytag_admins = async ({
  last_key,
}: GetAllPolytagAdminsInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'admin-user',
    partition_key: 'admin',
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'admin-user',
      ':partition_key': 'admin',
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
    admins: Items as AdminUser[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_polytag_admins };
