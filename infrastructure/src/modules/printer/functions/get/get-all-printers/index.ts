/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Printer } from '_modules/printer/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
export interface GetAllPrintersInput {
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_printers = async ({ last_key }: GetAllPrintersInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'printer',
    sort_key: 'printer',
    partition_key: decoded_last_key.partition_key,
  };

  const params: QueryCommandInput = {
    IndexName: 'datatype-pk-index',
    ExpressionAttributeValues: {
      ':datatype': 'printer',
    },
    KeyConditionExpression: 'datatype = :datatype',
    TableName: process.env.TABLE_NAME,
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
    printers: Items as Printer[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_printers };
