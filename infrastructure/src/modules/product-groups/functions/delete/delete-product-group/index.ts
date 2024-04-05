/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Interfaces ---------- */
interface DeleteProductGroup {
  brand_id: string;
  product_group_sort_key: string;
}

/* ---------- Function ---------- */
const delete_product_group = async ({
  brand_id,
  product_group_sort_key,
}: DeleteProductGroup) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_group_sort_key,
    },
    ReturnValues: 'ALL_OLD',
  };

  const command = new DeleteCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { product_group: Attributes as ProductGroup };
};

/* ---------- Export ---------- */
export { delete_product_group };
