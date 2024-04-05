/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { chunk, difference, isEqual } from 'lodash';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
} from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandGCP } from '_modules/brand-gcps/models';
import { Brand } from '_modules/brands/models';

/* ---------- Interfaces ---------- */
interface HandleBrandModifyInput {
  item: StreamRecord;
}

interface HandleBrandGCPsChangeInput {
  brand_id: string;
  old_gcps: string[];
  new_gcps: string[];
}

/* ---------- Functions ---------- */
const handle_brand_gcps_change = async ({
  brand_id,
  old_gcps,
  new_gcps,
}: HandleBrandGCPsChangeInput) => {
  if (isEqual(old_gcps, new_gcps)) return;

  const gcps_to_remove = difference(old_gcps, new_gcps);

  const gcps_to_add = difference(new_gcps, old_gcps);

  if (gcps_to_remove.length) {
    /* ----------
     * Deleting all GCP items
     * ---------- */

    const gcp_batches = chunk(gcps_to_remove, 25);

    const partition_key = `brand#${brand_id}`;

    for (const gcp_batch of gcp_batches) {
      const batch_delete_params: BatchWriteCommandInput = {
        RequestItems: {
          [process.env.TABLE_NAME as string]: gcp_batch.map(gcp => ({
            DeleteRequest: {
              Key: { partition_key, sort_key: `brand-gcp#${gcp}` },
            },
          })),
        },
      };

      const batch_delete_command = new BatchWriteCommand(batch_delete_params);

      await dynamodb_documentclient.send(batch_delete_command);
    }
  }

  if (gcps_to_add.length) {
    /* ----------
     * Creating new GCP items
     * ---------- */

    const gcp_batches = chunk(gcps_to_add, 25);

    const partition_key = `brand#${brand_id}`;

    for (const gcp_batch of gcp_batches) {
      const batch_create_params: BatchWriteCommandInput = {
        RequestItems: {
          [process.env.TABLE_NAME as string]: gcp_batch.map(gcp => {
            const new_gcp: BrandGCP = {
              gcp,
              partition_key,
              datatype: 'brand-gcp',
              sort_key: `brand-gcp#${gcp}`,
              created_at: new Date().getTime(),
            };

            return {
              PutRequest: {
                Item: new_gcp,
              },
            };
          }),
        },
      };

      const batch_create_command = new BatchWriteCommand(batch_create_params);

      await dynamodb_documentclient.send(batch_create_command);
    }
  }
};

const handle_brand_modify = async ({ item }: HandleBrandModifyInput) => {
  try {
    const { OldImage, NewImage } = item;

    if (!OldImage || !NewImage) return;

    const old_record = unmarshall(
      OldImage as Record<string, AttributeValue>,
    ) as Brand;

    const new_record = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as Brand;

    const brand_id = old_record.partition_key.split('#')[1];

    /* ----------
     * Based on the new GCPs associated to the
     * brand, delete and create brand-gcp items
     * ---------- */

    await handle_brand_gcps_change({
      brand_id,
      old_gcps: Array.from(old_record.gcp_list || []),
      new_gcps: Array.from(new_record.gcp_list || []),
    });
  } catch (err) {
    console.error('error at handle_brand_modify:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_brand_modify };
