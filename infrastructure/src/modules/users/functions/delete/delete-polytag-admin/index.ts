/* ---------- External ---------- */
import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { AdminUser } from '_modules/users/models/admin-user';

/* ---------- Interfaces ---------- */
interface DeletePolytagAdminInput {
  user_sub: string;
}

/* ---------- Function ---------- */
const delete_polytag_admin = async ({ user_sub }: DeletePolytagAdminInput) => {
  const delete_params: DeleteCommandInput = {
    Key: {
      partition_key: 'admin',
      sort_key: `admin-user#${user_sub}`,
    },
    TableName: process.env.TABLE_NAME,
    ReturnValues: 'ALL_OLD',
  };

  const delete_command = new DeleteCommand(delete_params);

  const { Attributes } = await dynamodb_documentclient.send(delete_command);

  const delete_user_params: AdminDeleteUserCommandInput = {
    Username: user_sub,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
  };

  const delete_user_command = new AdminDeleteUserCommand(delete_user_params);

  await cognito_client.send(delete_user_command);

  const { email } = Attributes as AdminUser;

  const delete_invite_params: DeleteCommandInput = {
    Key: {
      partition_key: 'admin',
      sort_key: `admin-invite#${email}`,
    },
    TableName: process.env.TABLE_NAME,
  };

  const delete_invite_command = new DeleteCommand(delete_invite_params);

  await dynamodb_documentclient.send(delete_invite_command);
};

/* ---------- Export ---------- */
export { delete_polytag_admin };
