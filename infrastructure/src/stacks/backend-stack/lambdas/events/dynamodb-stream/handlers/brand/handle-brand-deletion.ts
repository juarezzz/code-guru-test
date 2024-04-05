/* ---------- External ---------- */
import {
  QueryCommand,
  BatchWriteCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { chunk } from 'lodash';
import { DynamoDB } from 'aws-sdk';
import { StreamRecord } from 'aws-lambda';
import { WriteRequest } from '@aws-sdk/client-dynamodb';

/* ---------- Modules ---------- */
import { Brand } from '_modules/brands/models';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Constants ---------- */
const BATCH_SIZE = 25;

export const handle_brand_deletion = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = DynamoDB.Converter.unmarshall(OldImage) as Brand;

    const { partition_key } = record;

    /* ----------
     * 1. Querying items from the brand's
     * partition until there are none left
     * ---------- */
    let brand_pk_last_evaluated_key: Record<string, unknown> | undefined;

    do {
      const params: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: 'partition_key = :partition_key',
        ProjectionExpression: 'partition_key, sort_key',
        ExpressionAttributeValues: {
          ':partition_key': partition_key,
        },
        ExclusiveStartKey: brand_pk_last_evaluated_key,
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

      brand_pk_last_evaluated_key = LastEvaluatedKey;
    } while (brand_pk_last_evaluated_key);

    /* ----------
     * 3. Querying all printer associations to
     * the brand until there are no more left
     * ---------- */
    let printer_associations_last_evaluated_key:
      | Record<string, unknown>
      | undefined;

    do {
      const params: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        IndexName: 'datatype-sk-index',
        KeyConditionExpression: 'sort_key = :sort_key AND datatype = :datatype',
        ProjectionExpression: 'partition_key, sort_key',
        ExpressionAttributeValues: {
          ':datatype': 'printer-customer',
          ':sort_key': `printer-customer#${partition_key.split('#')[1]}`,
        },
        ExclusiveStartKey: printer_associations_last_evaluated_key,
      };

      const query_command = new QueryCommand(params);

      const { LastEvaluatedKey, Items } = await dynamodb_documentclient.send(
        query_command,
      );

      /* ----------
       * 4. Creating delete commands from the
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

      printer_associations_last_evaluated_key = LastEvaluatedKey;
    } while (printer_associations_last_evaluated_key);
  } catch (err) {
    console.error('handle_brand_deletion error: ', err);
  }
};
