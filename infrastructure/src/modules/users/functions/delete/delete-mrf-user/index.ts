/* ---------- External ---------- */
import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { DeleteCommand, DeleteCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Interfaces ---------- */
interface DeleteMRFUserInput {
  mrf_id: string;
  mrf_user_id: string;
}

/* ---------- Function ---------- */
const delete_mrf_user = async ({ mrf_id, mrf_user_id }: DeleteMRFUserInput) => {
  const delete_params: DeleteCommandInput = {
    Key: {
      partition_key: `mrf#${mrf_id}`,
      sort_key: `mrf-user#${mrf_user_id}`,
    },
    TableName: process.env.TABLE_NAME,
    ReturnValues: 'ALL_OLD',
  };

  const delete_command = new DeleteCommand(delete_params);

  const delete_user_params: AdminDeleteUserCommandInput = {
    Username: mrf_user_id,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
  };

  const delete_user_command = new AdminDeleteUserCommand(delete_user_params);

  await Promise.all([
    dynamodb_documentclient.send(delete_command),
    cognito_client.send(delete_user_command),
  ]);
};

/* ---------- Export ---------- */
export { delete_mrf_user };
