/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductAttributes } from '_modules/product-attributes/models';

/* ---------- Interfaces ---------- */
interface CreateProductAttributes {
  brand_id: string;
  sub: string;
  attributes: ProductAttributes['attributes'];
}

const create_product_attributes = async ({
  sub,
  brand_id,
  attributes,
}: CreateProductAttributes) => {
  const product_attributes: ProductAttributes = {
    created_at: new Date().getTime(),
    created_by: sub,
    updated_by: sub,
    datatype: 'brand-product-attributes',
    partition_key: `brand#${brand_id}`,
    sort_key: 'brand-product-attributes',
    updated_at: new Date().getTime(),
    attributes,
  };

  const params: PutCommandInput = {
    Item: product_attributes,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { product_attributes };
};

/* ---------- Export ---------- */
export { create_product_attributes };
