/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Interfaces ---------- */
interface DeleteProduct {
  product_sort_key: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const delete_product = async ({
  brand_id,
  product_sort_key,
}: DeleteProduct) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: product_sort_key,
    },
    ReturnValues: 'ALL_OLD',
  };

  const command = new DeleteCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return Attributes as Product;
};

/* ---------- Export ---------- */
export { delete_product };
