/* ---------- External ---------- */
import { chunk } from 'lodash';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { get_all_mrf_users } from '_modules/users/functions/get/get-all-mrf-users';

/* ---------- Models ---------- */
import { MRFUser } from '_modules/users/models/mrf-user';

/* ---------- Interface ---------- */
interface DeleteMRF {
  mrf_id: string;
}

/* ---------- Function ---------- */
const delete_mrf = async ({ mrf_id }: DeleteMRF) => {
  const promises: Promise<unknown>[] = [];

  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `mrf#${mrf_id}`,
      sort_key: 'mrf',
    },
    ReturnValues: 'ALL_OLD',
  };

  const delete_mrf_command = new DeleteCommand(params);

  let last_key: string | undefined;
  const mrf_users: MRFUser[] = [];

  do {
    const { mrf_users, last_evaluated_key } = await get_all_mrf_users({
      mrf_id,
      last_key,
    });

    last_key = last_evaluated_key;

    mrf_users.push(...mrf_users);
  } while (last_key);

  const delete_user_commands = mrf_users.map(mrf_user => {
    const username = mrf_user.sort_key.split('#')[1];

    const delete_user_command = new AdminDeleteUserCommand({
      Username: username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    return cognito_client.send(delete_user_command);
  });

  promises.push(
    dynamodb_documentclient.send(delete_mrf_command),
    ...delete_user_commands,
  );

  const promise_batches = chunk(promises, 25);

  for (const promise_batch of promise_batches) {
    await Promise.all(promise_batch);
  }
};

/* ---------- Export ---------- */
export { delete_mrf };
