/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductAttributes } from '_modules/product-attributes/models';
import { Attributes, Components, Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface UpdateProduct {
  brand_id: string;
  product_sort_key: string;
  current_attributes: Product['attributes'];
  new_attributes: ProductAttributes['attributes'];
}

/* ---------- Function ---------- */
const update_product_attributes = async ({
  brand_id,
  product_sort_key,
  current_attributes,
  new_attributes,
}: UpdateProduct) => {
  const updated_attributes = new_attributes.map(({ name, id }) => ({
    value: '',
    id,
    ...current_attributes.find(({ id: attr_id }) => attr_id === id),
    name,
  }));

  const expression_values: Record<
    string,
    string | string[] | Attributes[] | Components[]
  > = {
    ':attributes': updated_attributes,
  };

  const expression_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
    '#attributes': 'attributes',
  };

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_sort_key,
    },
    UpdateExpression: 'SET #attributes = :attributes',
    ExpressionAttributeValues: expression_values,

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
export { update_product_attributes };
