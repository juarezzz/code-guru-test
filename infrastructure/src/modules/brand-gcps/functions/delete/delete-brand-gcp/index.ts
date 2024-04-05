/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeleteBrandGCPInput {
  gcp: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const delete_brand_gcp = async ({ gcp, brand_id }: DeleteBrandGCPInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: `brand-gcp#${gcp}`,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_brand_gcp };
