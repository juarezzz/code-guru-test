/* ---------- External ---------- */
import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
} from '@aws-sdk/client-s3';
import { DeleteCommandInput, DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { s3_client } from '_clients/s3';

/* ---------- Interfaces ---------- */
interface DeleteAdminImage {
  sort_key: string;
  image_name: string;
}

/* ---------- Function ---------- */
const delete_admin_image = async ({
  image_name,
  sort_key,
}: DeleteAdminImage) => {
  const s3_params: DeleteObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Key: `common/admin-library-assets/${image_name}`,
  };

  const dynamodb_params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `admin`,
      sort_key,
    },
  };

  const s3_command = new DeleteObjectCommand(s3_params);
  const dynamodb_command = new DeleteCommand(dynamodb_params);

  const s3_promise = s3_client.send(s3_command);
  const dynamodb_promise = dynamodb_documentclient.send(dynamodb_command);

  await Promise.all([s3_promise, dynamodb_promise]);
};

/* ---------- Export ---------- */
export { delete_admin_image };
