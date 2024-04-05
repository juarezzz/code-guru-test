/* ---------- External ---------- */
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeleteBrand {
  brand_id: string;
}

/* ---------- Function ---------- */
const delete_brand = async ({ brand_id }: DeleteBrand) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: 'brand',
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_brand };
