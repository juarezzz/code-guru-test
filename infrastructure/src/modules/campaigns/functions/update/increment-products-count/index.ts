/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface IncrementProductsCountInput {
  value: number;
  brand_id: string;
  campaign_sort_key: string;
  product_group_index: number;
}

/* ---------- Function ---------- */
const increment_products_count = async ({
  value,
  brand_id,
  campaign_sort_key,
  product_group_index,
}: IncrementProductsCountInput) => {
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: campaign_sort_key,
    },
    UpdateExpression: `ADD campaign_product_groups[${product_group_index}].product_group_count :incr`,
    ExpressionAttributeValues: {
      ':incr': value,
    },
    ExpressionAttributeNames: {
      '#sort_key': 'sort_key',
      '#partition_key': 'partition_key',
    },
  };

  const command = new UpdateCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { increment_products_count };
