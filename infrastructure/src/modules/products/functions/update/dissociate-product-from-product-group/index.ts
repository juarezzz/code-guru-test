/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DissociateProductFromProductGroupInput {
  brand_id: string;
  product_sort_key: string;
  product_group_sort_key: string;
}

/* ---------- Function ---------- */
const dissociate_product_from_product_group = async ({
  brand_id,
  product_sort_key,
  product_group_sort_key,
}: DissociateProductFromProductGroupInput) => {
  const association_sort_key = `${product_group_sort_key}${product_sort_key}`;

  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      sort_key: association_sort_key,
      partition_key: `brand#${brand_id}`,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { dissociate_product_from_product_group };
