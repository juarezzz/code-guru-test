/* ---------- External ---------- */
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductComponents } from '_modules/product-components/models';

/* ---------- Interfaces ---------- */
interface GetProductComponents {
  brand_id: string;
}

/* ---------- Function ---------- */
const get_product_components = async ({ brand_id }: GetProductComponents) => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand-product-components',
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  if (!Item) return { product_components: undefined };

  return {
    product_components: Item as ProductComponents,
  };
};

/* ---------- Export ---------- */
export { get_product_components };
