/* ---------- External ---------- */
import { TimestreamWriteClient } from '@aws-sdk/client-timestream-write';
import { TimestreamQueryClient } from '@aws-sdk/client-timestream-query';

/* ---------- Client ---------- */
export const timestream_client_write = new TimestreamWriteClient({});

export const timestream_client_query = new TimestreamQueryClient({});
