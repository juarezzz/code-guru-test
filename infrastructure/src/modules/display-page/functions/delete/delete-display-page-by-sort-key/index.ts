/* ---------- External ---------- */
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
interface DeleteDisplayPageBySortKeyInput {
  brand_id: string;
  display_page_sort_key: string;
}

/* ---------- Function ---------- */
const delete_display_page_by_sort_key = async ({
  brand_id,
  display_page_sort_key,
}: DeleteDisplayPageBySortKeyInput) => {
  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: display_page_sort_key,
    },
  };

  const command = new DeleteCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { delete_display_page_by_sort_key };
