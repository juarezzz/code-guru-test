/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Image } from '_modules/image-library/models';

/* ---------- Interfaces ---------- */
interface CreateImageInput {
  url: string;
  size: number;
  sort_key: string;
  created_by: string;
  image_name: string;
  partition_key: string;
}

/* ---------- Function ---------- */
const create_image = async ({
  url,
  size,
  sort_key,
  created_by,
  image_name,
  partition_key,
}: CreateImageInput) => {
  const search = `brand-image#${image_name
    .replace(/\.(png|svg|jpe?g)$/i, '')
    .replace(/\s/g, '_')
    .toLocaleLowerCase()}`;

  const new_image: Image = {
    url,
    size,
    search,
    sort_key,
    created_by,
    partition_key,
    datatype: 'brand-image',
    created_at: new Date().getTime(),
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: new_image,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return new_image;
};

/* ---------- Export ---------- */
export { create_image };
