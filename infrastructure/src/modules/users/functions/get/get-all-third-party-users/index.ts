/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ThirdPartyUser } from '_modules/users/models/third-party-user';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllThirdPartyUsersInput {
  third_party_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_third_party_users = async ({
  last_key,
  third_party_id,
}: GetAllThirdPartyUsersInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'third-party-user',
    sort_key: decoded_last_key.sort_key,
    partition_key: `third-party#${third_party_id}`,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'third-party-user',
      ':partition_key': `third-party#${third_party_id}`,
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
    third_party_users: Items as ThirdPartyUser[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_third_party_users };
