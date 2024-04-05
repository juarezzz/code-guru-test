/* ---------- External ---------- */
import {
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
  SignUpCommand,
  SignUpCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand, PutCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { PrinterUser } from '_modules/users/models/printer-user';

/* ---------- Interfaces ---------- */
interface CreatePrinterUser {
  printer_id: string;
  email: string;
  password: string;
  created_by: string;
}

/* ---------- Function ---------- */
const create_printer_user = async ({
  email,
  printer_id,
  password,
  created_by,
}: CreatePrinterUser) => {
  const sign_up_params: SignUpCommandInput = {
    ClientId: process.env.PRINTER_COGNITO_CLIENT_ID,
    Password: password,
    Username: email,
    UserAttributes: [
      { Name: 'custom:full_name', Value: '' },
      { Name: 'custom:printer_id', Value: printer_id },
    ],
  };

  const sign_up_command = new SignUpCommand(sign_up_params);

  const { UserSub } = await cognito_client.send(sign_up_command);

  const add_to_group_params: AdminAddUserToGroupCommandInput = {
    GroupName: 'printer-admin',
    UserPoolId: process.env.PRINTER_COGNITO_USERPOOL_ID,
    Username: email,
  };

  const add_to_group_command = new AdminAddUserToGroupCommand(
    add_to_group_params,
  );

  await cognito_client.send(add_to_group_command);

  const printer_user: PrinterUser = {
    created_at: new Date().getTime(),
    datatype: 'printer-user',
    email,
    last_login: new Date().getTime(),
    partition_key: `printer#${printer_id}`,
    sort_key: `printer-user#${UserSub}`,
    updated_at: new Date().getTime(),
    created_by,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: printer_user,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { printer_user };
};

/* ---------- Export ---------- */
export { create_printer_user };
