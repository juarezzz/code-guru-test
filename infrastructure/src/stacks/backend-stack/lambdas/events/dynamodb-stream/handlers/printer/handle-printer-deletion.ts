/* ---------- External ---------- */
import {
  QueryCommand,
  BatchWriteCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { WriteRequest } from '@aws-sdk/client-dynamodb';

/* ---------- Modules ---------- */
import { Printer } from '_modules/printer/models';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';
import { chunk } from 'lodash';

/* ---------- Constants ---------- */
const BATCH_SIZE = 25;

export const handle_printer_deletion = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = DynamoDB.Converter.unmarshall(OldImage) as Printer;

    const { partition_key } = record;

    /* ----------
     * 1. Querying items from the printer's
     * partition until there are none left
     * ---------- */
    let last_evaluated_key: Record<string, unknown> | undefined;

    do {
      const params: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'partition_key = :partition_key',
        ProjectionExpression: 'partition_key, sort_key',
        ExpressionAttributeValues: {
          ':partition_key': partition_key,
        },
        ExclusiveStartKey: last_evaluated_key,
      };

      const query_command = new QueryCommand(params);

      const { LastEvaluatedKey, Items } = await dynamodb_documentclient.send(
        query_command,
      );

      /* ----------
       * 2. Creating delete commands from the
       * returned items, adding them to batch
       * write commands and running them in paralell
       * ---------- */
      const batch_write_promises: BatchWriteCommand[] = [];

      for (const list_subset of chunk(Items, BATCH_SIZE)) {
        const delete_commands: WriteRequest[] = list_subset.map(
          partition_record => ({
            DeleteRequest: {
              Key: partition_record,
            },
          }),
        );

        const batch_write_cmd = new BatchWriteCommand({
          RequestItems: {
            [process.env.TABLE_NAME || '']: delete_commands,
          },
        });

        batch_write_promises.push(batch_write_cmd);
      }

      await Promise.all(
        batch_write_promises.map(cmd => dynamodb_documentclient.send(cmd)),
      );

      last_evaluated_key = LastEvaluatedKey;
    } while (last_evaluated_key);
  } catch (err) {
    console.error('handle_printer_deletion error: ', err);
  }
};
