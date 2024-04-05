/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Interfaces ---------- */
export interface GetAllProductGroupsByName {
  brand_id: string;
  product_group_name: string;
}

/* ---------- Function ---------- */
const get_all_product_groups_by_name = async ({
  brand_id,
  product_group_name,
}: GetAllProductGroupsByName) => {
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
      ':search': `brand-product-group#${product_group_name
        .replace(/\s/g, '_')
        .toLocaleLowerCase()}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  return { product_groups: Items as ProductGroup[] };
};

/* ---------- Export ---------- */
export { get_all_product_groups_by_name };
