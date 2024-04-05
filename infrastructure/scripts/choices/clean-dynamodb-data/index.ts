/* ---------- External ---------- */
import _ from 'lodash';
import {
  BatchWriteCommand,
  BatchWriteCommandInput,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/lib-dynamodb';

/* ---------- Constants ---------- */
import { new_datatypes } from '__scripts/constants/migration/datatypes';

/* ---------- Clients ---------- */
import { clients } from '__scripts/utils/clients';
import { DeleteRequest } from '@aws-sdk/client-dynamodb';

/* ---------- Interfaces ---------- */
interface CleanTimestreamData {
  environment: string;
}

export const clean_dynamodb_data = async ({
  environment,
}: CleanTimestreamData) => {
  try {
    for (const datatype of new_datatypes) {
      let last_key: QueryCommandInput['ExclusiveStartKey'];

      do {
        const params: QueryCommandInput = {
          TableName: `MainTable-${environment}`,
          IndexName: 'datatype-index',
          KeyConditionExpression: 'datatype = :datatype',
          ExpressionAttributeValues: {
            ':datatype': datatype,
          },
          ExclusiveStartKey: last_key,
        };

        const command: QueryCommand = new QueryCommand(params);

        const { Items, LastEvaluatedKey } = await clients.dynamodb.send(
          command,
        );

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
    }
  } catch (err) {
    console.log(err);
  }
};
