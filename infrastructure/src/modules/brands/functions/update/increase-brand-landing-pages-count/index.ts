/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

interface LandingPagesCountInput {
  brand_id: string;
  amount: number;
}

const increase_brand_landing_pages_count = async ({
  brand_id,
  amount,
}: LandingPagesCountInput) => {
  const update_params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand',
    },
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    UpdateExpression: 'ADD landing_pages_count :val',
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

export { increase_brand_landing_pages_count };
