/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Interfaces ---------- */
interface CreateProductGroupInput {
  brand_id: string;
  owner_name: string;
  owner_sub: string;
  product_group_name: string;
}

/* ---------- Function ---------- */
const create_product_group = async ({
  brand_id,
  owner_name,
  owner_sub,
  product_group_name,
}: CreateProductGroupInput) => {
  const product_group: ProductGroup = {
    partition_key: `brand#${brand_id}`,
    sort_key: `brand-product-group#${uuidv4()}`,
    datatype: 'brand-product-group',
    search: `brand-product-group#${product_group_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
    product_group_name,
    products_count: 0,
    owner_name,
    owner_sub,
    created_at: new Date().getTime(),
    updated_at: new Date().getTime(),
    created_by: owner_sub,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_not_exists(partition_key) AND attribute_not_exists(sort_key)',
    Item: product_group,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return product_group;
};

/* ---------- Export ---------- */
export { create_product_group };
