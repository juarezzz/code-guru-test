/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Types ---------- */
import { AWS } from '__@types';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
export interface GetAllProductsInput {
  last_key?: string;
  brand_id?: string;
}

export interface GetAllProductsOutput {
  products: Product[];
  last_evaluated_key?: string;
}

/* ---------- Function ---------- */
const get_all_products = async ({
  brand_id,
  last_key,
}: GetAllProductsInput): Promise<GetAllProductsOutput> => {
  const decoded_last_key = decode_last_key({ last_key });

  const key_partition_key = brand_id
    ? `brand#${brand_id}`
    : decoded_last_key?.partition_key;

  const exclusive_start_key = decoded_last_key && {
    datatype: 'brand-product',
    partition_key: key_partition_key,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression: brand_id
      ? 'datatype = :datatype AND partition_key = :partition_key'
      : 'datatype = :datatype',
    ExpressionAttributeValues: {
      ':datatype': 'brand-product',
    },
    ExclusiveStartKey: exclusive_start_key,
  };

  if (brand_id) {
    params.ExpressionAttributeValues = {
      ...params.ExpressionAttributeValues,
      ':partition_key': `brand#${brand_id}`,
    };
  }

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  const preserve_list: Array<keyof AWS.DynamoDBLastKey> = ['sort_key'];

  if (!brand_id) preserve_list.push('partition_key');

  const last_evaluated_key = encode_last_key({
    last_evaluated_key: LastEvaluatedKey,
    preserve: preserve_list,
  });

  return { products: Items as Product[], last_evaluated_key };
};

/* ---------- Export ---------- */
export { get_all_products };
