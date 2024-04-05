/* ---------- External ---------- */
import { chunk } from 'lodash';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { get_all_third_party_users } from '_modules/users/functions/get/get-all-third-party-users';

/* ---------- Models ---------- */
import { ThirdPartyUser } from '_modules/users/models/third-party-user';

/* ---------- Interface ---------- */
interface DeleteThirdParty {
  third_party_id: string;
}

/* ---------- Function ---------- */
const delete_third_party = async ({ third_party_id }: DeleteThirdParty) => {
  const promises: Promise<unknown>[] = [];

  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `third-party#${third_party_id}`,
      sort_key: 'third-party',
    },
    ReturnValues: 'ALL_OLD',
  };

  const delete_third_party_command = new DeleteCommand(params);

  let last_key: string | undefined;
  const third_party_users: ThirdPartyUser[] = [];

  do {
    const { third_party_users, last_evaluated_key } =
      await get_all_third_party_users({
        last_key,
        third_party_id,
      });

    last_key = last_evaluated_key;

    third_party_users.push(...third_party_users);
  } while (last_key);

  const delete_user_commands = third_party_users.map(third_party_user => {
    const username = third_party_user.sort_key.split('#')[1];

    const delete_user_command = new AdminDeleteUserCommand({
      Username: username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    return cognito_client.send(delete_user_command);
  });

  promises.push(
    dynamodb_documentclient.send(delete_third_party_command),
    ...delete_user_commands,
  );

  const promise_batches = chunk(promises, 25);

  for (const promise_batch of promise_batches) {
    await Promise.all(promise_batch);
  }
};

/* ---------- Export ---------- */
export { delete_third_party };
