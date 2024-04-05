/* ---------- External ---------- */
import {
  BatchWriteCommand,
  BatchWriteCommandOutput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { WriteRequest } from '@aws-sdk/client-dynamodb';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Constants ---------- */
const BATCH_SIZE = 25;

export const handle_mrf_deletion = async ({ item }: { item: StreamRecord }) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = DynamoDB.Converter.unmarshall(OldImage) as Mrf;

    const { partition_key } = record;

    /* ----------
     * 1. Querying items from the orgs
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
      const batch_write_promises: Promise<BatchWriteCommandOutput>[] = [];

      for (let i = 0; i < (Items?.length || 0); i += BATCH_SIZE) {
        const list_subset = Items?.slice(i, i + BATCH_SIZE) || [];

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

        const command_call = dynamodb_documentclient.send(batch_write_cmd);

        batch_write_promises.push(command_call);
      }

      await Promise.all(batch_write_promises);

      last_evaluated_key = LastEvaluatedKey;
    } while (last_evaluated_key);
  } catch (err) {
    console.log('handle_mrf_deletion error: ', err);
  }
};
