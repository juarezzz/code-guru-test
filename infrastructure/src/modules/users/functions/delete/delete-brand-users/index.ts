/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  QueryCommand,
  DeleteCommand,
  DeleteCommandOutput,
} from '@aws-sdk/lib-dynamodb';
import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { User } from '_modules/users/models/user';

/* ---------- Constants ---------- */
interface DeleteBrandUsersInput {
  brand_id: string;
}

/* ---------- Constants ---------- */
const BATCH_SIZE = 25;

/* ---------- Function ---------- */
export const delete_brand_users = async ({
  brand_id,
}: DeleteBrandUsersInput) => {
  /* ----------
   * 1. Listing all brand users from the Database
   * ---------- */
  const list_brand_users_command = new QueryCommand({
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-account',
      ':partition_key': `brand#${brand_id}`,
    },
  });

  const brand_users_query_result = await dynamodb_documentclient.send(
    list_brand_users_command,
  );

  const brand_users_list = brand_users_query_result.Items as User[];

  /* ----------
   * 2. Creating delete commands
   * to execute them in batch
   * ---------- */
  const delete_commands: Promise<
    AdminDeleteUserCommandOutput | DeleteCommandOutput
  >[] = brand_users_list
    .map(brand_user => {
      const user_sub = brand_user.sort_key.replace('brand-user#', '');

      const cognito_delete_command = new AdminDeleteUserCommand({
        Username: user_sub,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
      });

      const dynamo_delete_command = new DeleteCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          sort_key: brand_user.sort_key,
          partition_key: brand_user.partition_key,
        },
      });

      return [
        cognito_client.send(cognito_delete_command),
        dynamodb_documentclient.send(dynamo_delete_command),
      ];
    })
    .flat();

  /* ----------
   * 3. Splitting the commands into
   * batches and running them
   * ---------- */
  const delete_batches = chunk(delete_commands, BATCH_SIZE);

  for (const delete_batch of delete_batches) {
    await Promise.all(delete_batch);
  }
};
