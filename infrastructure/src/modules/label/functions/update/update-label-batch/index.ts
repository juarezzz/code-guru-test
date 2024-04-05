/* ---------- External ---------- */
import {
  BatchWriteCommandInput,
  BatchWriteCommand,
  BatchWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import { chunk } from 'lodash';

/* ---------- Clients ---------- */
import { dynamodb_documentclient_lower_attempts } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
export interface Serial {
  gtin: string;
  brand_id: string;
  serial: string;
  sub: string;
}

export type UpdateLabelBatch = Serial[];
/* ---------- Function ---------- */
const update_label_batch = async (items: UpdateLabelBatch) => {
  const put_request_array = items.map(item => {
    return {
      PutRequest: {
        Item: {
          partition_key: `brand#${item.brand_id}`,
          sort_key: `brand-product#${item.gtin}serial#${item.serial}`,
          printed: true,
          timetolive:
            Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 12 * 5,
          datatype: 'brand-label',
          printed_at: Date.now(),
          created_by: item.sub,
          third_parties: [],
        },
      },
    };
  });

  const request_batches = chunk(put_request_array, 25);

  const unprocessed_items: BatchWriteCommandOutput['UnprocessedItems'][] = [];

  for (const batch of request_batches) {
    const params: BatchWriteCommandInput = {
      RequestItems: {
        [process.env.TABLE_NAME as string]: [...batch],
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
export { update_label_batch };
