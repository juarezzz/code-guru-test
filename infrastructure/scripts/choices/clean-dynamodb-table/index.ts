/* ---------- External ---------- */
import _ from 'lodash';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  QueryCommandInput,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { DeleteRequest } from '@aws-sdk/client-dynamodb';

/* ---------- Clients ---------- */
import { clients } from '../../utils/clients';

/* ---------- Interfaces ---------- */
interface CleanTimestreamData {
  environment: string;
}

export const clean_dynamodb_table = async ({
  environment,
}: CleanTimestreamData) => {
  try {
    let last_key: QueryCommandInput['ExclusiveStartKey'];

    do {
      const params = new ScanCommand({
        TableName: `MainTable-${environment}`,
      });

      const { Items, LastEvaluatedKey } = await clients.dynamodb.send(params);

      last_key = LastEvaluatedKey;

      if (!Items) continue;

      console.log(`Removing: ${Items.length}`);

      const deletes: { DeleteRequest: DeleteRequest }[] = [];

      for (const Item of Items) {
        deletes.push({
          DeleteRequest: {
            Key: {
              partition_key: Item.partition_key,
              sort_key: Item.sort_key,
            },
          },
        });
      }

      const deletes_batches = _.chunk(deletes, 25);

      console.log(`Batches: ${deletes_batches.length}`);

      for (const batch of deletes_batches) {
        const params3: BatchWriteCommandInput = {
          RequestItems: {
            [`MainTable-${environment}` as string]: [...batch],
          },
        };

        const command3 = new BatchWriteCommand(params3);

        await clients.dynamodb.send(command3);
      }
    } while (last_key);
  } catch (err) {
    console.log(err);
  }
};
