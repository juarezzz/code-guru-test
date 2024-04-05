/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface IncrementProductsCountInput {
  value: number;
  brand_id: string;
  campaign_sort_key: string;
}

/* ---------- Function ---------- */
const increment_form_events_count = async ({
  value,
  brand_id,
  campaign_sort_key,
}: IncrementProductsCountInput) => {
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: campaign_sort_key,
    },
    UpdateExpression: `ADD campaign_form_events_count :incr`,
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
export { increment_form_events_count };
