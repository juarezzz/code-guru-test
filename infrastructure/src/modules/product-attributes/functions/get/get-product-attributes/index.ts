/* ---------- External ---------- */
import { GetCommand, GetCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductAttributes } from '_modules/product-attributes/models';

/* ---------- Interfaces ---------- */
interface GetProductAttributes {
  brand_id: string;
}

/* ---------- Function ---------- */
const get_product_attributes = async ({ brand_id }: GetProductAttributes) => {
  const params: GetCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand-product-attributes',
    },
  };

  const command = new GetCommand(params);

  const { Item } = await dynamodb_documentclient.send(command);

  if (!Item) return { product_attributes: undefined };

  return {
    product_attributes: Item as ProductAttributes,
  };
};
/* ---------- Export ---------- */
export { get_product_attributes };
