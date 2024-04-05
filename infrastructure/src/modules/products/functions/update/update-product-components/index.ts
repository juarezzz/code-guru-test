/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { ProductComponents } from '_modules/product-components/models';

/* ---------- Models ---------- */
import { Components, Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface UpdateProduct {
  brand_id: string;
  product_sort_key: string;
  new_components: ProductComponents['components'];
  current_components: Product['components'];
}

/* ---------- Function ---------- */
const update_product_components = async ({
  brand_id,
  product_sort_key,
  new_components,
  current_components,
}: UpdateProduct) => {
  const updated_components = new_components.map(({ name, id }) => ({
    material: '',
    weight: 10,
    percentage: 50,
    id,
    ...current_components.find(({ id: comp_id }) => comp_id === id),
    name,
  }));

  const expression_values: Record<string, string | string[] | Components[]> = {
    ':components': updated_components,
  };

  const expression_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
    '#components': 'components',
  };

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_sort_key,
    },
    UpdateExpression: 'SET #components = :components',
    ExpressionAttributeValues: expression_values,

    ExpressionAttributeNames: {
      ...expression_names,
    },
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return Attributes as Product;
};

/* ---------- Export ---------- */
export { update_product_components };
