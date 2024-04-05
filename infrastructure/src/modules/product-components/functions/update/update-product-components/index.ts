/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductComponents } from '_modules/product-components/models';

/* ---------- Interfaces ---------- */
interface UpdateProductComponents {
  sub: string;
  brand_id: string;
  components: ProductComponents['components'];
}

/* ---------- Function ---------- */
const update_product_components = async ({
  sub,
  brand_id,
  components,
}: UpdateProductComponents) => {
  const update_expression = [
    '#components = :components',
    '#updated_by = :updated_by',
    '#updated_at = :updated_at',
  ].join(', ');

  const expression_values = {
    ':components': components,
    ':updated_by': sub,
    ':updated_at': new Date().getTime(),
  };

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand-product-components',
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
      '#components': 'components',
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

  return Attributes as ProductComponents;
};

/* ---------- Export ---------- */
export { update_product_components };
