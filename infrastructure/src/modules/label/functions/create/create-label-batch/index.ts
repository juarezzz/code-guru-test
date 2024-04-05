/* ---------- External ---------- */
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient_lower_attempts } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
export interface Serial {
  gtin: string;
  brand_id: string;
  serial: string;
  sub: string;
}

export type CreateLabelBatch = Serial[];

/* ---------- Function ---------- */
const create_label_batch = async (batch: CreateLabelBatch) => {
  const results = await Promise.allSettled(
    batch.map(item => {
      const label_item = {
        partition_key: `brand#${item.brand_id}`,
        sort_key: `brand-product#${item.gtin}serial#${item.serial}`,
        printed: false,
        timetolive: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 5,
        datatype: 'brand-label',
        created_at: Date.now(),
        created_by: item.sub,
        third_parties: [],
      };

      const params: PutCommandInput = {
        Item: label_item,
        ConditionExpression: 'attribute_not_exists(partition_key)',
        TableName: process.env.TABLE_NAME,
      };

      const command = new PutCommand(params);

      return dynamodb_documentclient_lower_attempts.send(command);
    }),
  );

  const duplicate_items: Serial[] = [];
  const unprocessed_items: Serial[] = [];

  results.forEach((result, i) => {
    if (result.status === 'rejected')
      if (result.reason.name === 'ConditionalCheckFailedException') {
        duplicate_items.push(batch[i]);
      } else {
        console.error(
          `Item ${JSON.stringify(
            batch[i],
          )} failed to process with error: ${JSON.stringify(result.reason)}`,
        );
        unprocessed_items.push(batch[i]);
      }
  });

  return { unprocessed_items, duplicate_items };
};

/* ---------- Export ---------- */
export { create_label_batch };
