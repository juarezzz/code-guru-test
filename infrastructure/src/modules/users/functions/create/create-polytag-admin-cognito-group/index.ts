/* ---------- External ---------- */
import {
  AdminAddUserToGroupCommand,
  AdminAddUserToGroupCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface CreatePolytagAdminInput {
  cognito_group: string;
  email: string;
}

/* ---------- Function ---------- */
const create_polytag_admin_cognito_group = async ({
  cognito_group,
  email,
}: CreatePolytagAdminInput) => {
  const add_to_group_params: AdminAddUserToGroupCommandInput = {
    GroupName: cognito_group,
    UserPoolId: process.env.COGNITO_USERPOOL_ID,
    Username: email,
  };

  const add_to_group_command = new AdminAddUserToGroupCommand(
    add_to_group_params,
  );

  await cognito_client.send(add_to_group_command);
};

/* ---------- Export ---------- */
export { create_polytag_admin_cognito_group };
