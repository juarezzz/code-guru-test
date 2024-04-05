/* ---------- External ---------- */
import {
  AdminRemoveUserFromGroupCommand,
  AdminRemoveUserFromGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface DeletePolytagAdminCognitoGroupInput {
  cognito_group: string;
  email: string;
}

/* ---------- Function ---------- */
const delete_polytag_admin_cognito_group = async ({
  cognito_group,
  email,
}: DeletePolytagAdminCognitoGroupInput) => {
  const remove_from_group_params: AdminRemoveUserFromGroupCommandInput = {
    GroupName: cognito_group,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    Username: email,
  };

  const remove_from_group_command = new AdminRemoveUserFromGroupCommand(
    remove_from_group_params,
  );

  await cognito_client.send(remove_from_group_command);
};

/* ---------- Export ---------- */
export { delete_polytag_admin_cognito_group };
