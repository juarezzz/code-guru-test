/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface GetProductBySortKey {
  brand_id: string;
  product_sort_key: string;
}

/* ---------- Function ---------- */
const get_product_by_sort_key = async ({
  brand_id,
  product_sort_key,
}: GetProductBySortKey) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': product_sort_key,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return { product: undefined };

  return { product: Items[0] as Product };
};

/* ---------- Export ---------- */
export { get_product_by_sort_key };
