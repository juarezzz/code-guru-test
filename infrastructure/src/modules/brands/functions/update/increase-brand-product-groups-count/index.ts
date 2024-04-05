/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

interface BrandProductGroup {
  brand_id: string;
  amount: number;
}

const increase_brand_product_groups_count = async ({
  brand_id,
  amount,
}: BrandProductGroup) => {
  const update_params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand',
    },
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    UpdateExpression: 'ADD product_groups_count :val',
    ExpressionAttributeValues: {
      ':val': amount,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    },
  };

  await dynamodb_documentclient.send(new UpdateCommand(update_params));
};

export { increase_brand_product_groups_count };
