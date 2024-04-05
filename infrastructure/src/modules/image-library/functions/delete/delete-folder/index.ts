/* ---------- External ---------- */
import {
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  ListObjectsCommand,
  ListObjectsCommandInput,
} from '@aws-sdk/client-s3';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';

/* ---------- Interfaces ---------- */
interface DeleteFolderInput {
  brand_id: string;
}

/* ---------- Function ---------- */
const delete_folder = async ({ brand_id }: DeleteFolderInput) => {
  const list_params: ListObjectsCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Prefix: brand_id,
  };

  const list_command = new ListObjectsCommand(list_params);

  const list_results = await s3_client.send(list_command);

  const { Contents } = list_results;

  if (!Contents) return;

  const batch_delete_input: DeleteObjectsCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Delete: {
      Objects: Contents.map(content => ({ Key: content.Key })),
    },
  };

  const batch_delete_command = new DeleteObjectsCommand(batch_delete_input);

  await s3_client.send(batch_delete_command);
};

/* ---------- Export ---------- */
export { delete_folder };
