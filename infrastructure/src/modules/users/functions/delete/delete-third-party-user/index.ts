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
interface DeleteThirdPartyUserInput {
  third_party_id: string;
  third_party_user_id: string;
}

/* ---------- Function ---------- */
const delete_third_party_user = async ({
  third_party_id,
  third_party_user_id,
}: DeleteThirdPartyUserInput) => {
  const delete_params: DeleteCommandInput = {
    Key: {
      partition_key: `third-party#${third_party_id}`,
      sort_key: `third-party-user#${third_party_user_id}`,
    },
    TableName: process.env.TABLE_NAME,
    ReturnValues: 'ALL_OLD',
  };

  const delete_command = new DeleteCommand(delete_params);

  const delete_user_params: AdminDeleteUserCommandInput = {
    Username: third_party_user_id,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
  };

  const delete_user_command = new AdminDeleteUserCommand(delete_user_params);

  await Promise.all([
    dynamodb_documentclient.send(delete_command),
    cognito_client.send(delete_user_command),
  ]);
};

/* ---------- Export ---------- */
export { delete_third_party_user };
