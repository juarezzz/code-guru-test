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
import { MRFUser } from '_modules/users/models/mrf-user';

/* ---------- Interfaces ---------- */
export interface CreateMrfUserInput {
  mrf_id: string;
  email: string;
  password: string;
  role: string;
}

/* ---------- Function ---------- */
const create_mrf_user = async ({
  email,
  mrf_id,
  password,
  role,
}: CreateMrfUserInput) => {
  const sign_up_params: SignUpCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Password: password,
    Username: email,
    UserAttributes: [
      { Name: 'custom:full_name', Value: '' },
      { Name: 'custom:mrf_id', Value: mrf_id },
    ],
  };

  const sign_up_command = new SignUpCommand(sign_up_params);

  const { UserSub } = await cognito_client.send(sign_up_command);

  const add_to_group_params: AdminAddUserToGroupCommandInput = {
    GroupName: role,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    Username: email,
  };

  const add_to_group_command = new AdminAddUserToGroupCommand(
    add_to_group_params,
  );

  await cognito_client.send(add_to_group_command);

  const mrf_user: MRFUser = {
    created_at: new Date().getTime(),
    datatype: 'mrf-user',
    email,
    last_login: new Date().getTime(),
    partition_key: `mrf#${mrf_id}`,
    sort_key: `mrf-user#${UserSub}`,
    updated_at: new Date().getTime(),
    filter: `mrf-invitation#${email}`,
    role,
    status: 'ACTIVE',
  };

  const params: PutCommandInput = {
    TableName: process.env.TABLE_NAME,
    Item: mrf_user,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return { mrf_user };
};

/* ---------- Export ---------- */
export { create_mrf_user };
