/* ---------- External ---------- */
import { S3Event } from 'aws-lambda';
import { GetObjectCommand, GetObjectCommandInput } from '@aws-sdk/client-s3';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';

/* ---------- Modules ---------- */
import { create_image } from '_modules/image-library/functions/create/create-image';
import { create_admin_image } from '_modules/image-library/functions/create/create-admin-image';

/* ---------- Types ---------- */
type MetadataType = {
  created_by: string;
  partition_key: string;
  sort_key: string;
};

export const handler = async (event: S3Event): Promise<void> => {
  try {
    const [record] = event.Records;

    if (!record) return;

    const { awsRegion } = record;
    const { key, size } = record.s3.object;
    const decoded_key = decodeURIComponent(key.replace(/\+/g, ' '));
    const bucket_name = record.s3.bucket.name;
    const url = `https://${bucket_name}.s3.${awsRegion}.amazonaws.com/${decoded_key}`;

    const params: GetObjectCommandInput = {
      Bucket: bucket_name,
      Key: decoded_key,
    };

    const command = new GetObjectCommand(params);

    const { Metadata } = await s3_client.send(command);
    const { partition_key, sort_key, created_by } = Metadata as MetadataType;

    if (partition_key.includes('brand#')) {
      const brand_id = partition_key.replace('brand#', '');

      await create_image({
        url,
        size,
        sort_key,
        created_by,
        partition_key,
        image_name: decoded_key.replace(`${brand_id}/`, ''),
      });

      return;
    }

    await create_admin_image({
      url,
      size,
      sort_key,
      created_by,
      partition_key,
      image_name: decoded_key.replace('common/admin-library-assets/', ''),
    });
  } catch (err) {
    console.error(`error at s3-stream: ${err},`);
  }
};
