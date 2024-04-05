/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Types ---------- */
import { GetProductGroupByNameInput } from '_modules/product-groups/functions/get/get-product-group-by-name/@types';

/* ---------- Function ---------- */
const get_product_group_by_name = async ({
  brand_id,
  product_group_name,
}: GetProductGroupByNameInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND #search = :search',
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

  if (!Items || Items.length === 0) return undefined;

  return Items[0] as ProductGroup;
};

/* ---------- Export ---------- */
export { get_product_group_by_name };
