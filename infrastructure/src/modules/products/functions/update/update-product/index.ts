/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Attributes, Components, Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface UpdateProduct {
  attributes?: Attributes[];
  brand_id: string;
  components?: Components[];
  image_url?: string;
  information_url?: string;
  product_description?: string;
  product_group_name?: string;
  product_group_sort_key?: string;
  product_name?: string;
  product_sort_key: string;
}
/* ---------- Function ---------- */
const update_product = async ({
  attributes,
  brand_id,
  components,
  image_url,
  information_url,
  product_description,
  product_group_name,
  product_group_sort_key,
  product_name,
  product_sort_key,
}: UpdateProduct) => {
  const add_statements = [
    attributes !== undefined && `attributes = :attributes`,
    components !== undefined && `components = :components`,
    product_description !== undefined &&
      `product_description = :product_description`,
    product_name !== undefined && `product_name = :product_name`,
    product_name !== undefined && `#search = :search`,
    image_url !== undefined && `image_url = :image_url`,
    information_url !== undefined && `information_url = :information_url`,
  ];

  const remove_statements = [];

  if (
    product_group_name !== undefined &&
    product_group_sort_key !== undefined
  ) {
    add_statements.push('product_group_name = :product_group_name');
    add_statements.push('product_group_sort_key = :product_group_sort_key');
  } else {
    remove_statements.push('product_group_name');
    remove_statements.push('product_group_sort_key');
  }

  const add_expression = add_statements
    .filter(expression => expression)
    .join(', ');

  const remove_expression = remove_statements
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<
    string,
    string | string[] | Attributes[] | Components[]
  > = {};

  const expression_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
  };

  if (
    product_group_name !== undefined &&
    product_group_sort_key !== undefined
  ) {
    expression_values[':product_group_name'] = product_group_name;
    expression_values[':product_group_sort_key'] = product_group_sort_key;
  }

  if (attributes !== undefined)
    expression_values[':attributes'] = [...attributes];

  if (components !== undefined)
    expression_values[':components'] = [...components];

  if (product_description !== undefined)
    expression_values[':product_description'] = product_description;

  if (product_name !== undefined) {
    expression_values[':product_name'] = product_name;

    expression_values[':search'] = `brand-product#${product_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`;

    expression_names['#search'] = 'search';
  }

  if (image_url !== undefined) expression_values[':image_url'] = image_url;

  if (information_url !== undefined)
    expression_values[':information_url'] = information_url;

  const update_parts = [];

  if (add_expression.length) update_parts.push(`SET ${add_expression}`);

  if (remove_expression.length)
    update_parts.push(`REMOVE ${remove_expression}`);

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_sort_key,
    },
    UpdateExpression: update_parts.join(' '),
    ExpressionAttributeValues: add_expression.length
      ? {
          ...expression_values,
        }
      : undefined,
    ExpressionAttributeNames: {
      ...expression_names,
    },
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes: ReturnedAttributes } = await dynamodb_documentclient.send(
    command,
  );

  return ReturnedAttributes as Product;
};

/* ---------- Export ---------- */
export { update_product };
