/* ---------- External ---------- */
import {
  AdminDeleteUserCommand,
  AdminDeleteUserCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Client ---------- */
import { cognito_client } from '_clients/cognito';

const delete_cognito_third_party_user = async (email: string) => {
  const user_params: AdminDeleteUserCommandInput = {
    UserPoolId: process.env.THIRD_PARTY_COGNITO_USERPOOL_ID,
    Username: email,
  };

  const command = new AdminDeleteUserCommand(user_params);
  await cognito_client.send(command);
};

export { delete_cognito_third_party_user };
