/* ---------- External ---------- */
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface UpdateProductGroupFieldsInput {
  brand_id: string;
  product_group_sort_key: string;
  assigned_campaign_name?: string;
  assigned_campaign_sort_key?: string;
  owner_name?: string;
  owner_sub?: string;
  product_group_name?: string;
}

/* ---------- Constants ---------- */
const IDENTIFIERS = ['brand_id', 'product_group_sort_key'];

/* ---------- Function ---------- */
export const update_product_group_fields = async (
  input: UpdateProductGroupFieldsInput,
) => {
  const { brand_id, product_group_sort_key } = input;

  const changed_attributes_list: string[] = [];
  const attributes_values: Record<string, unknown> = {
    ':updated_at': Date.now(),
  };

  const expression_attribute_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
  };

  for (const [key, value] of Object.entries(input)) {
    if (IDENTIFIERS.includes(key) || typeof value === 'undefined') continue;

    changed_attributes_list.push(key);
    attributes_values[`:${key}`] = value;
  }

  if (!changed_attributes_list.length) return;

  const update_rows_array = changed_attributes_list.map(
    attribute => `${attribute} = :${attribute}`,
  );

  if (input.product_group_name) {
    expression_attribute_names['#search'] = 'search';
    changed_attributes_list.push('#search');
    attributes_values[
      ':search'
    ] = `brand-product-group#${input.product_group_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`;
    update_rows_array.push('#search = :search');
  }
  const update_expression = `SET ${update_rows_array.join(
    ', ',
  )}, updated_at = :updated_at`;

  const update_product_group_command = new UpdateCommand({
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_group_sort_key,
    },
    ExpressionAttributeNames: expression_attribute_names,
    ExpressionAttributeValues: attributes_values,
    UpdateExpression: update_expression,
  });

  await dynamodb_documentclient.send(update_product_group_command);
};
