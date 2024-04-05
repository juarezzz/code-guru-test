/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface AssociateProductToProductGroupInput {
  brand_id: string;
  product_sort_key: string;
  product_group_sort_key: string;
}

/* ---------- Function ---------- */
const associate_product_to_product_group = async ({
  brand_id,
  product_sort_key,
  product_group_sort_key,
}: AssociateProductToProductGroupInput) => {
  const association_sort_key = `${product_group_sort_key}${product_sort_key}`;

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: {
      sort_key: association_sort_key,
      partition_key: `brand#${brand_id}`,
      datatype: 'brand-product-to-product-group',
    },
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { associate_product_to_product_group };
