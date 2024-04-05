/* ---------- External ---------- */
import { DigitalLink } from 'digital-link.js';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { BatchWriteCommandOutput } from '@aws-sdk/lib-dynamodb';
import { _Record } from '@aws-sdk/client-timestream-write';
import { padStart } from 'lodash';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';
import { sqs_client } from '_clients/sqs';

/* ---------- Modules ---------- */
import {
  Serial,
  create_label_batch,
} from '_modules/label/functions/create/create-label-batch';
import { update_label_batch } from '_modules/label/functions/update/update-label-batch';
import { create_confirmed_batch } from '_modules/label/functions/create/create-confirmed-batch';
import { update_labels_request_batch_info } from '_modules/label/functions/update/update-labels-request-batch-info';
import { create_label_printed_records } from '_modules/label/functions/create/create-label-printed-records';

/* ---------- Helpers ---------- */
import { unique_serial } from '_helpers/utils/unique-serial';

/* ---------- Interfaces ---------- */
interface Serials {
  brand_id: string;
  gtin: string;
  serial: string;
  sub: string;
}

interface PrintRequest {
  sub: string;
  gtin: string;
  amount: number;
  brand_id: string;
  printer_id: string;
  request_id: string;
  batch_index: number;
}

interface CreateConfirmedOperation {
  command: 'create-confirmed';
  print_request: PrintRequest;
}

export type Parsed =
  | {
      command: 'create' | 'confirm';
      serials: Serials[];
    }
  | CreateConfirmedOperation;

interface FailedItems {
  dynamodb?: BatchWriteCommandOutput['UnprocessedItems'][] | Serial[];
  timestream?: _Record[];
}

const create_labels = async (parsed: Parsed) => {
  const { command } = parsed;

  const failed_items: FailedItems = {};

  if (command === 'confirm') {
    const { serials } = parsed;
    const unprocessed_items = await update_label_batch(serials || []);
    const rejected_records = await create_label_printed_records(serials || []);

    failed_items.dynamodb = unprocessed_items;
    failed_items.timestream = rejected_records;
  }

  if (command === 'create') {
    const { serials } = parsed;
    const { unprocessed_items, duplicate_items } = await create_label_batch(
      serials || [],
    );
    if (duplicate_items.length)
      console.log(`Duplicate labels found: ${duplicate_items}`);

    failed_items.dynamodb = unprocessed_items;
  }

  if (command === 'create-confirmed') {
    const { print_request } = parsed;

    const new_serials = new Array(print_request.amount).fill(0).map(() => {
      const unique_id = unique_serial();

      const dl = DigitalLink({
        domain: `https://${process.env.RESOLVER_DOMAIN}`,
        identifier: {
          // Make all GTINS 14 characters long as per GS1 standards
          '01': padStart(print_request.gtin, 14, '0'),
        },
        keyQualifiers: {
          '21': unique_id,
        },
      });

      return {
        serial: unique_id,
        sub: print_request.sub,
        gtin: print_request.gtin,
        brand_id: print_request.brand_id,
        request_id: print_request.request_id,
        digital_link_url: dl.toWebUriString(),
      };
    });

    const unprocessed_items = await create_confirmed_batch(new_serials);
    const rejected_records = await create_label_printed_records(new_serials);

    failed_items.dynamodb = unprocessed_items;
    failed_items.timestream = rejected_records;

    const digital_link_urls = new_serials.map(
      ({ digital_link_url }) => digital_link_url,
    );

    const save_to_s3_command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `serialised-codes/${print_request.request_id}/tmp/batch-${print_request.batch_index}.json`,
      Body: JSON.stringify(digital_link_urls),
    });

    await s3_client.send(save_to_s3_command);

    await update_labels_request_batch_info({
      complete: true,
      ...print_request,
    });
  }

  if (failed_items.dynamodb?.length || failed_items.timestream?.length) {
    console.log(
      `Message will be sent to dead-letter queue with the following items: ${JSON.stringify(
        failed_items,
      )}`,
    );

    const params: SendMessageCommandInput = {
      MessageBody: JSON.stringify({
        command,
        unprocessed_items: failed_items,
      }),
      QueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
      DelaySeconds: 60,
    };

    const queue_command = new SendMessageCommand(params);

    await sqs_client.send(queue_command);
  }
};

/* ---------- Export ---------- */
export { create_labels };
