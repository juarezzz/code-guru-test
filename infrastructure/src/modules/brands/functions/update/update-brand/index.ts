/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
interface UpdateBrand {
  brand_id: string;
  live_campaigns_count?: number;
  logo_url?: string;
  products_count?: number;
  qrs_printed_count?: number;
  qrs_printed_db_count?: number;
  total_reach_count?: number;
  users_count?: number;
}

/* ---------- Function ---------- */
const update_brand = async ({
  brand_id,
  live_campaigns_count,
  logo_url,
  products_count,
  qrs_printed_count,
  qrs_printed_db_count,
  total_reach_count,
  users_count,
}: UpdateBrand) => {
  const update_expression = [
    logo_url && `logo_url = :logo_url`,
    products_count !== undefined && `products_count = :products_count`,
    users_count !== undefined && `users_count = :users_count`,
    live_campaigns_count !== undefined &&
      `live_campaigns_count = :live_campaigns_count`,
    total_reach_count !== undefined && `total_reach_count = :total_reach_count`,
    qrs_printed_count !== undefined && `qrs_printed_count = :qrs_printed_count`,
    `updated_at = :updated_at`,
    qrs_printed_db_count !== undefined &&
      `qrs_printed_db_count = :qrs_printed_db_count`,
  ]
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<string, string | string[] | number> = {};

  if (logo_url) expression_values[':logo_url'] = logo_url;

  if (products_count !== undefined)
    expression_values[':products_count'] = products_count;

  if (users_count !== undefined)
    expression_values[':users_count'] = users_count;

  if (live_campaigns_count !== undefined)
    expression_values[':live_campaigns_count'] = live_campaigns_count;

  if (total_reach_count !== undefined)
    expression_values[':total_reach_count'] = total_reach_count;

  if (qrs_printed_count !== undefined)
    expression_values[':qrs_printed_count'] = qrs_printed_count;

  if (qrs_printed_db_count !== undefined)
    expression_values[':qrs_printed_db_count'] = qrs_printed_db_count;

  expression_values[':updated_at'] = Date.now();

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand',
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
  };

  const command = new UpdateCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { update_brand };
