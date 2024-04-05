/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface GetAllProductsByName {
  brand_id: string;
  product_name: string;
}

/* ---------- Function ---------- */
const get_all_products_by_name = async ({
  brand_id,
  product_name,
}: GetAllProductsByName) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(#search, :search)',
    ExpressionAttributeNames: {
      '#search': 'search',
    },
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':search': `brand-product#${product_name
        .replace(/\s/g, '_')
        .toLocaleLowerCase()}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  return {
    products: Items as Product[],
  };
};

/* ---------- Export ---------- */
export { get_all_products_by_name };
