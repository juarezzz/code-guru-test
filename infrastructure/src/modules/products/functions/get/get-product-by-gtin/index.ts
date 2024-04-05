/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Product } from '_modules/products/models';

/* ---------- Types ---------- */
interface GetProductByGtin {
  gtin: string;
}

/* ---------- Function ---------- */
const get_product_by_gtin = async ({ gtin }: GetProductByGtin) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    Limit: 1,
    KeyConditionExpression: 'datatype = :datatype AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-product',
      ':sort_key': `brand-product#${gtin}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return { product: undefined };

  return { product: Items[0] as Product };
};

/* ---------- Export ---------- */
export { get_product_by_gtin };
