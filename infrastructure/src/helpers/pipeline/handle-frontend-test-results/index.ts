/* -------------- External -------------- */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { pipeline } from 'node:stream/promises';
import { createWriteStream, createReadStream } from 'fs';
import { join } from 'path';
import { Readable } from 'node:stream';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Parse } from 'unzipper';

export const handle_download_and_decompress_zip_file = async (
  object_key: string,
  commit_hash: string,
): Promise<string[]> => {
  const s3_client = new S3Client({});

  const get_command = new GetObjectCommand({
    Bucket: process.env.SOURCE_BUCKET_NAME,
    Key: object_key,
  });

  const data = await s3_client.send(get_command);

  const tmp_folder_path = '/tmp';
  const zip_file_path = join(tmp_folder_path, 'reports.zip');

  await pipeline(
    data.Body?.transformToWebStream() as Readable,
    createWriteStream(zip_file_path),
  );

  const filtered_files: string[] = [];

  const zip = createReadStream(zip_file_path).pipe(
    Parse({ forceStream: true }),
  );

  for await (const entry of zip) {
    const file = {
      name: entry.path,
      format: entry.path.split('.')[1],
    };

    if (['html', 'txt'].includes(file.format)) {
      filtered_files.push(file.name);

      entry
        .pipe(createWriteStream(`${tmp_folder_path}/${file.name}`))
        .on('finish', async () => {
          const file_stream = createReadStream(
            join(tmp_folder_path, file.name),
          );

          const upload_command = new PutObjectCommand({
            Bucket: process.env.SOURCE_BUCKET_NAME,
            Key: `${process.env.ENVIRONMENT}/playwright/${commit_hash}/results/${file.name}`,
            Body: file_stream as Readable,
            ContentType: file.format === 'html' ? 'text/html' : 'plain/text',
          });

          await s3_client.send(upload_command);
        });
    }
  }

  return filtered_files;
};
