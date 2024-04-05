/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductComponents } from '_modules/product-components/models';

/* ---------- Interfaces ---------- */
interface CreateProductComponents {
  brand_id: string;
  sub: string;
  components: ProductComponents['components'];
}

const create_product_components = async ({
  sub,
  brand_id,
  components,
}: CreateProductComponents) => {
  const product_components: ProductComponents = {
    created_at: new Date().getTime(),
    created_by: sub,
    updated_by: sub,
    datatype: 'brand-product-components',
    partition_key: `brand#${brand_id}`,
    sort_key: 'brand-product-components',
    updated_at: new Date().getTime(),
    components,
  };

  const params: PutCommandInput = {
    Item: product_components,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { product_components };
};

/* ---------- Export ---------- */
export { create_product_components };
