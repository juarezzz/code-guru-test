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
import { AdminUser } from '_modules/users/models/admin-user';

/* ---------- Interfaces ---------- */
interface CreatePolytagAdminInput {
  email: string;
  password: string;
  group: string;
}

/* ---------- Function ---------- */
const create_polytag_admin = async ({
  email,
  group,
  password,
}: CreatePolytagAdminInput) => {
  const sign_up_params: SignUpCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Password: password,
    Username: email,
    UserAttributes: [{ Name: 'custom:full_name', Value: '' }],
  };

  const sign_up_command = new SignUpCommand(sign_up_params);

  const { UserSub } = await cognito_client.send(sign_up_command);

  const add_to_group_params: AdminAddUserToGroupCommandInput = {
    GroupName: group,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    Username: email,
  };

  const add_to_group_command = new AdminAddUserToGroupCommand(
    add_to_group_params,
  );

  await cognito_client.send(add_to_group_command);

  const admin_user: AdminUser = {
    created_at: new Date().getTime(),
    datatype: 'admin-user',
    partition_key: `admin`,
    sort_key: `admin-user#${UserSub}`,
    updated_at: new Date().getTime(),
    cognito_group: group,
    last_login: new Date().getTime(),
    email,
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: admin_user,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);
};

/* ---------- Export ---------- */
export { create_polytag_admin };
