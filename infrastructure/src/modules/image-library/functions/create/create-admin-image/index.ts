/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Image } from '_modules/image-library/models';

/* ---------- Interfaces ---------- */
interface CreateAdminImage {
  created_by: string;
  image_name: string;
  size: number;
  url: string;
  partition_key: string;
  sort_key: string;
}

/* ---------- Function ---------- */
const create_admin_image = async ({
  partition_key,
  sort_key,
  created_by,
  image_name,
  url,
  size,
}: CreateAdminImage) => {
  const image: Image = {
    created_at: new Date().getTime(),
    created_by,
    datatype: 'admin-image',
    partition_key,
    search: `admin-image#${image_name
      .replace(/\.(png|svg|jpe?g)$/i, '')
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`,
    size,
    sort_key,
    url,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: image,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return image;
};

/* ---------- Export ---------- */
export { create_admin_image };
