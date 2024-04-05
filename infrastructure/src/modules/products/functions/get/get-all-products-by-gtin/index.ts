/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface GetAllProductsByGTIN {
  gtin: string;
}

/* ---------- Function ---------- */
const get_all_products_by_gtin = async ({ gtin }: GetAllProductsByGTIN) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression:
      'datatype = :datatype AND begins_with(#sort_key, :sort_key)',
    ExpressionAttributeNames: {
      '#sort_key': 'sort_key',
    },
    ExpressionAttributeValues: {
      ':datatype': 'brand-product',
      ':sort_key': `brand-product#${gtin}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  return { products: Items as Product[] };
};

/* ---------- Export ---------- */
export { get_all_products_by_gtin };
