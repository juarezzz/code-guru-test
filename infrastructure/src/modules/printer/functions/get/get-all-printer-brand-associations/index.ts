/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterCustomer } from '_modules/printer/models/printer-customer';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Interfaces ---------- */
export interface GetAllPrinterBrandAssociationsInput {
  printer_id: string;
  last_key?: string;
}

/* ---------- Function ---------- */
const get_all_printer_brand_associations = async ({
  printer_id,
  last_key,
}: GetAllPrinterBrandAssociationsInput) => {
  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    datatype: 'printer-customer',
    sort_key: decoded_last_key.sort_key,
    partition_key: `printer#${printer_id}`,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'printer-customer',
      ':partition_key': `printer#${printer_id}`,
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
    associated_brands: Items as PrinterCustomer[],
    last_evaluated_key,
  };
};

/* ---------- Export ---------- */
export { get_all_printer_brand_associations };
