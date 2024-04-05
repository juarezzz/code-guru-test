/* ---------- External ---------- */
import { TimestreamWriteClient } from '@aws-sdk/client-timestream-write';
import { TimestreamQueryClient } from '@aws-sdk/client-timestream-query';

/* ---------- Config ---------- */
import { accessKeyId, region, secretAccessKey } from '__server/config.json';

/* ---------- Client ---------- */
export const timestream_client_write = new TimestreamWriteClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

export const timestream_client_query = new TimestreamQueryClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});
