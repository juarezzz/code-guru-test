/* ---------- External ---------- */
import { S3Client } from '@aws-sdk/client-s3';

/* ---------- Config ---------- */
import { accessKeyId, region, secretAccessKey } from '__server/config.json';

/* ---------- Client ---------- */
export const s3_client = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
