/* ---------- External ---------- */
import {
  ChangePasswordCommand,
  ChangePasswordCommandOutput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface UpdateUserPasswordInput {
  access_token: string;
  old_password: string;
  new_password: string;
}

/* ---------- Function ---------- */
const update_user_password = async ({
  access_token,
  old_password,
  new_password,
}: UpdateUserPasswordInput): Promise<ChangePasswordCommandOutput> => {
  const change_password_command = new ChangePasswordCommand({
    AccessToken: access_token,
    PreviousPassword: old_password,
    ProposedPassword: new_password,
  });

  return cognito_client.send(change_password_command);
};

/* ---------- Export ---------- */
export { update_user_password };
