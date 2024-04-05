/* ---------- External ---------- */
import { chunk } from 'lodash';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';
import { AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { get_all_printer_users } from '_modules/users/functions/get/get-all-printer-users';

/* ---------- Models ---------- */
import { PrinterUser } from '_modules/users/models/printer-user';

/* ---------- Interface ---------- */
interface DeletePrinter {
  printer_id: string;
}

/* ---------- Function ---------- */
const delete_printer = async ({ printer_id }: DeletePrinter) => {
  const promises: Promise<unknown>[] = [];

  const params: DeleteCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: {
      partition_key: `printer#${printer_id}`,
      sort_key: 'printer',
    },
    ReturnValues: 'ALL_OLD',
  };

  const delete_printer_command = new DeleteCommand(params);

  let last_key: string | undefined;
  const printer_users: PrinterUser[] = [];

  do {
    const { printer_users, last_evaluated_key } = await get_all_printer_users({
      last_key,
      printer_id,
    });

    last_key = last_evaluated_key;

    printer_users.push(...printer_users);
  } while (last_key);

  const delete_user_commands = printer_users.map(printer_user => {
    const username = printer_user.sort_key.split('#')[1];

    const delete_user_command = new AdminDeleteUserCommand({
      Username: username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    return cognito_client.send(delete_user_command);
  });

  promises.push(
    dynamodb_documentclient.send(delete_printer_command),
    ...delete_user_commands,
  );

  const promise_batches = chunk(promises, 25);

  for (const promise_batch of promise_batches) {
    await Promise.all(promise_batch);
  }
};

/* ---------- Export ---------- */
export { delete_printer };
