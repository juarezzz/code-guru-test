/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  BatchWriteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {
  RejectedRecordsException,
  WriteRecordsCommand,
  _Record,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';
import { dynamodb_documentclient } from '_clients/dynamodb';
import { timestream_client_write } from '_clients/timestream';

/* ---------- Modules ---------- */
import {
  Serial,
  create_label_batch,
} from '_modules/label/functions/create/create-label-batch';

/* ---------- Interfaces ---------- */
interface CreateCommandOperation {
  command: 'create';
  unprocessed_items: {
    dynamodb: Serial[];
    timestream: _Record[];
  };
}

export type UnprocessedParsed = (
  | {
      command: 'confirm' | 'create-confirmed';
      unprocessed_items: {
        dynamodb: BatchWriteCommandOutput['UnprocessedItems'][];
        timestream: _Record[];
      };
    }
  | CreateCommandOperation
) & { failed_attempt_number?: number };

/* ---------- Constants ---------- */
const MAX_FAILED_ATTEMPTS = 5;

const retry_create_labels = async (parsed: UnprocessedParsed) => {
  const { unprocessed_items, command, failed_attempt_number } = parsed;
  const failed_items: Partial<UnprocessedParsed['unprocessed_items']> = {};

  if (unprocessed_items.dynamodb?.length) {
    if (command === 'create') {
      const { unprocessed_items: unprocessed, duplicate_items } =
        await create_label_batch(unprocessed_items.dynamodb || []);

      if (duplicate_items.length)
        console.log(`Duplicate labels found: ${duplicate_items}`);

      failed_items.dynamodb = unprocessed;
    } else
      for (const batch of unprocessed_items.dynamodb) {
        const params: BatchWriteCommandInput = {
          RequestItems: batch,
        };

        const write_command = new BatchWriteCommand(params);

        try {
          const { UnprocessedItems } = await dynamodb_documentclient.send(
            write_command,
          );

          if (UnprocessedItems && Object.keys(UnprocessedItems).length)
            failed_items.dynamodb = failed_items.dynamodb
              ? (
                  failed_items.dynamodb as BatchWriteCommandOutput['UnprocessedItems'][]
                ).concat([UnprocessedItems])
              : [UnprocessedItems];
        } catch {
          failed_items.dynamodb = failed_items.dynamodb
            ? (
                failed_items.dynamodb as BatchWriteCommandOutput['UnprocessedItems'][]
              ).concat([batch])
            : [batch];
        }
      }
  }

  if (unprocessed_items.timestream?.length) {
    const records_batch = chunk(unprocessed_items.timestream, 100);
    for (const batch of records_batch) {
      const rejected_records: _Record[] = [];
      const params = {
        DatabaseName: process.env.TIMESTREAM_NAME,
        TableName: process.env.TIMESTREAM_NAME,
        Records: batch,
      };
      const write_command = new WriteRecordsCommand(params);
      try {
        await timestream_client_write.send(write_command);
      } catch (e) {
        console.error('Error while inserting records in Timestream: ', e);
        if (e instanceof RejectedRecordsException && e.RejectedRecords)
          e.RejectedRecords.forEach(rejected => {
            const rejected_record =
              unprocessed_items.timestream[rejected.RecordIndex ?? -1];
            return rejected_record && rejected_records.push(rejected_record);
          });
      }
      failed_items.timestream = [
        ...(failed_items.timestream ?? []),
        ...rejected_records,
      ];
    }
  }

  if (failed_items.dynamodb?.length || failed_items.timestream?.length) {
    const updated_failed_attempts = (failed_attempt_number ?? 0) + 1;

    console.log(
      `Message will be sent back to the dead-letter queue for the ${updated_failed_attempts} time(s) with the following items: ${JSON.stringify(
        failed_items,
      )}`,
    );

    if (updated_failed_attempts > MAX_FAILED_ATTEMPTS) {
      console.log(
        `Could not process message after ${MAX_FAILED_ATTEMPTS} attempts. Message body: ${JSON.stringify(
          parsed,
        )}`,
      );
      return;
    }

    const params: SendMessageCommandInput = {
      MessageBody: JSON.stringify({
        command,
        unprocessed_items: failed_items,
        failed_attempt_number: updated_failed_attempts,
      }),
      QueueUrl: process.env.DEAD_LETTER_QUEUE_URL,
      DelaySeconds: 60 * 3 * updated_failed_attempts,
    };
    const queue_command = new SendMessageCommand(params);

    await sqs_client.send(queue_command);
  }
};

/* ---------- Export ---------- */
export { retry_create_labels };
