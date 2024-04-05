/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  BatchWriteCommandInput,
  BatchWriteCommand,
  BatchWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient_lower_attempts } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
export interface Batch {
  gtin: string;
  brand_id: string;
  serial: string;
  sub: string;
  request_id: string;
}

export type CreateConfirmedBatchInput = Batch[];

/* ---------- Function ---------- */
const create_confirmed_batch = async (batch: CreateConfirmedBatchInput) => {
  const items_batches = chunk(batch, 25);
  const unprocessed_items: BatchWriteCommandOutput['UnprocessedItems'][] = [];

  for (const serials_batch of items_batches) {
    const put_request_array = serials_batch.map(item => {
      return {
        PutRequest: {
          Item: {
            partition_key: `brand#${item.brand_id}`,
            sort_key: `brand-product#${item.gtin}serial#${item.serial}`,
            printed: true,
            request_id: item.request_id,
            timetolive:
              Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 12 * 5,
            datatype: 'brand-label',
            created_at: Date.now(),
            created_by: item.sub,
            printed_at: Date.now(),
            third_parties: [],
          },
        },
      };
    });

    const params: BatchWriteCommandInput = {
      RequestItems: {
        [process.env.TABLE_NAME as string]: [...put_request_array],
      },
    };

    const command = new BatchWriteCommand(params);

    try {
      const { UnprocessedItems } =
        await dynamodb_documentclient_lower_attempts.send(command, {});
      if (UnprocessedItems && Object.keys(UnprocessedItems).length)
        unprocessed_items.push(UnprocessedItems);
    } catch (e) {
      console.error('Batch failed to process with error: ', e);
      console.log(JSON.stringify(params.RequestItems));
      unprocessed_items.push(params.RequestItems);
    }
  }

  return unprocessed_items;
};

/* ---------- Export ---------- */
export { create_confirmed_batch };
