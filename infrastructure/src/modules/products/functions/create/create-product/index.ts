/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { CreateProductInput } from '_modules/products/functions/create/create-product/@types';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Function ---------- */
const create_product = async ({
  created_by,
  brand_id,
  product_input,
  product_group_sort_key,
}: CreateProductInput) => {
  const {
    product_name,
    product_description,
    gtin,
    product_group_name,
    attributes,
    components,
  } = product_input;

  const product: Product = {
    attributes,
    components,
    created_at: new Date().getTime(),
    created_by,
    datatype: 'brand-product',
    gtin,
    partition_key: `brand#${brand_id}`,
    product_description,
    product_group_name,
    product_group_sort_key,
    product_name,
    search: `brand-product#${product_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
    sort_key: `brand-product#${gtin}`,
    updated_at: new Date().getTime(),
  };

  const params: PutCommandInput = {
    ConditionExpression: 'attribute_not_exists(#sort_key)',
    TableName: process.env.TABLE_NAME,
    Item: product,
    ExpressionAttributeNames: {
      '#sort_key': 'sort_key',
    },
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return product;
};

/* ---------- Export ---------- */
export { create_product };
