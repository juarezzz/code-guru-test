/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Interfaces ---------- */
interface GetProductGroupBySortKey {
  brand_id: string;
  product_group_sort_key: string;
}

/* ---------- Function ---------- */
const get_product_group_by_sort_key = async ({
  brand_id,
  product_group_sort_key,
}: GetProductGroupBySortKey) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': product_group_sort_key,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return undefined;

  return Items[0] as ProductGroup;
};

/* ---------- Export ---------- */
export { get_product_group_by_sort_key };
