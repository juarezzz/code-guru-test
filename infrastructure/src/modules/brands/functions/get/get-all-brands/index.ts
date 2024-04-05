/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
interface GetAllBrandsInput {
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_brands = async ({ last_key }: GetAllBrandsInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'brand',
    sort_key: 'brand',
    partition_key: decoded_last_key.partition_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression: 'datatype = :datatype',
    ExpressionAttributeValues: {
      ':datatype': 'brand',
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

  return {
    brands: Items as Brand[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_brands };
