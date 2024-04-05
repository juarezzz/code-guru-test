/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductAttributes } from '_modules/product-attributes/models';

/* ---------- Interfaces ---------- */
interface UpdateProductAttributes {
  sub: string;
  brand_id: string;
  attributes: ProductAttributes['attributes'];
}

/* ---------- Function ---------- */
const update_product_attributes = async ({
  sub,
  brand_id,
  attributes,
}: UpdateProductAttributes) => {
  const update_expression = [
    '#attributes = :attributes',
    '#updated_by = :updated_by',
    '#updated_at = :updated_at',
  ].join(', ');

  const expression_values = {
    ':attributes': attributes,
    ':updated_by': sub,
    ':updated_at': new Date().getTime(),
  };

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand-product-attributes',
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
      '#attributes': 'attributes',
      '#updated_by': 'updated_by',
      '#updated_at': 'updated_at',
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return Attributes as ProductAttributes;
};

/* ---------- Export ---------- */
export { update_product_attributes };
