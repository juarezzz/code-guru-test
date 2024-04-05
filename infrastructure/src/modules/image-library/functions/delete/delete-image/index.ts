/* ---------- External ---------- */
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interface ---------- */
interface DeleteImageInput {
  s3_key: string;
  brand_id: string;
  sort_key: string;
}

/* ---------- Function ---------- */
const delete_image = async ({
  s3_key,
  brand_id,
  sort_key,
}: DeleteImageInput) => {
  const s3_params: DeleteObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Key: `${brand_id}/${s3_key}`,
  };

  const dynamodb_params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key,
    },
  };

  const s3_command = new DeleteObjectCommand(s3_params);
  const dynamodb_command = new DeleteCommand(dynamodb_params);

  await Promise.all([
    s3_client.send(s3_command),
    dynamodb_documentclient.send(dynamodb_command),
  ]);
};

/* ---------- Export ---------- */
export { delete_image };
