/* ---------- External ---------- */
import {
  GetObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  ListObjectsV2CommandOutput,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { chunk } from 'lodash';
import { Duration } from 'aws-cdk-lib';
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/* ---------- Models ---------- */
import { LabelsRequest } from '_modules/label/models/labels-request';

/* ---------- Modules ---------- */
import { send_labels_email_to_printer_users } from '_modules/printer/functions/send/send-labels-email-to-printer-users';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface HandlePrinterLabelsRequestModifyInput {
  item: StreamRecord;
}

interface ListAllBatchFilesInput {
  request_id: string;
}

interface GetFileContentInput {
  key: string;
}

interface CreateResultFileInput {
  format: string;
  serials: string[];
  gtin: string;
}

interface CreateResultFileOutput {
  title: string;
  file_raw: string;
}

/* ---------- Constants ---------- */
const MAX_BATCHES_PROCESSED = 10;

const FORMAT_EXTENSION_MAP: Record<string, string> = {
  csv: '.csv',
  xml: '.xml',
  json: '.json',
};

/* ---------- Functions ---------- */
const list_all_batch_files = async ({ request_id }: ListAllBatchFilesInput) => {
  const list_params: ListObjectsV2CommandInput = {
    Bucket: process.env.BUCKET_NAME,
    Prefix: `serialised-codes/${request_id}/tmp/`,
  };

  const item_keys: string[] = [];

  let continuation_token:
    | ListObjectsV2CommandOutput['ContinuationToken']
    | undefined;

  do {
    list_params.ContinuationToken = continuation_token;

    const list_command = new ListObjectsV2Command(list_params);

    const { Contents, NextContinuationToken } = await s3_client.send(
      list_command,
    );

    const results = (Contents?.map(item => item.Key) as string[]) || [];
    const filtered = results.filter(key => key.endsWith('.json'));

    item_keys.push(...filtered);

    continuation_token = NextContinuationToken;
  } while (continuation_token);

  return item_keys;
};

const get_file_content = async ({ key }: GetFileContentInput) => {
  const get_command = new GetObjectCommand({
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  });

  const { Body } = await s3_client.send(get_command);

  const raw_content = await Body?.transformToString();
  const parsed_content: string[] = JSON.parse(raw_content || '[]');

  return parsed_content;
};

const create_result_file = ({
  format,
  serials,
  gtin,
}: CreateResultFileInput): CreateResultFileOutput => {
  const title = `${gtin}-serials-${serials.length}${
    FORMAT_EXTENSION_MAP[format] || '.txt'
  }`;

  let file_raw;

  switch (format) {
    case 'csv': {
      const rows_list = ['Serials', ...serials];
      file_raw = rows_list.join('\n');

      break;
    }

    case 'xml': {
      const xml_header = '<?xml version="1.0" encoding="UTF-8"?>';

      const xml_items = serials
        .map(serial => `<item>${serial}</item>`)
        .join('\n');

      file_raw = `${xml_header}\n<items>\n${xml_items}\n</items>`;

      break;
    }

    case 'json': {
      file_raw = JSON.stringify(serials);

      break;
    }

    default:
      file_raw = serials.join('\n');

      break;
  }

  return { title, file_raw };
};

const handle_printer_labels_request_modify = async ({
  item,
}: HandlePrinterLabelsRequestModifyInput) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const new_record = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as LabelsRequest;

    /* ----------
     * Checking if the request is still pending.
     * If not, we don't need to do anything.
     * ---------- */
    if (new_record.status !== 'PENDING') return;

    const all_batches_processed = Object.values(new_record.batches_info).every(
      processed => processed,
    );

    /* ----------
     * Checking if all batches are processed.
     * If not, we don't need to do anything.
     * ---------- */
    if (!all_batches_processed) return;

    const request_id = new_record.sort_key.split('#')[1];
    const printer_id = new_record.partition_key.split('#')[1];

    try {
      /* ----------
       * Listing JSON files in the /tmp file
       * ---------- */
      const files_keys = await list_all_batch_files({ request_id });

      const serials_list: string[] = [];

      /* ----------
       * Downloading, parsing and adding serials to the list
       * ---------- */
      for (const keys_batch of chunk(files_keys, MAX_BATCHES_PROCESSED)) {
        const grouped_serials = await Promise.all(
          keys_batch.map(key => get_file_content({ key })),
        );

        serials_list.push(...grouped_serials.flat());
      }

      /* ----------
       * Generating file based on the
       * format and saving it to S3
       * ---------- */
      const { title, file_raw } = create_result_file({
        serials: serials_list,
        format: new_record.format,
        gtin: new_record.gtin,
      });

      const save_command = new PutObjectCommand({
        Body: file_raw,
        Bucket: process.env.BUCKET_NAME,
        Key: `serialised-codes/${request_id}/${title}`,
      });

      await s3_client.send(save_command);

      const get_result_command = new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: `serialised-codes/${request_id}/${title}`,
      });

      const download_url = await getSignedUrl(s3_client, get_result_command, {
        expiresIn: Duration.days(2).toSeconds(),
      });

      await send_labels_email_to_printer_users({
        printer_id,
        download_url,
        request_info: new_record,
      });

      /* ----------
       * Marking the request as completed.
       * ---------- */
      const update_item_command = new UpdateCommand({
        TableName: process.env.LABELS_TABLE_NAME,
        Key: {
          sort_key: new_record.sort_key,
          partition_key: new_record.partition_key,
        },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'COMPLETED',
        },
      });

      await dynamodb_documentclient.send(update_item_command);
    } catch (err) {
      /* ----------
       * Marking the request as failed.
       * ---------- */
      const update_item_command = new UpdateCommand({
        TableName: process.env.LABELS_TABLE_NAME,
        Key: {
          sort_key: new_record.sort_key,
          partition_key: new_record.partition_key,
        },
        UpdateExpression: 'set #status = :status',
        ExpressionAttributeNames: {
          '#status': 'status',
        },
        ExpressionAttributeValues: {
          ':status': 'FAILED',
        },
      });

      await dynamodb_documentclient.send(update_item_command);

      throw err;
    }
  } catch (err) {
    console.error('error at handle_printer_labels_request_modify:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_printer_labels_request_modify };
