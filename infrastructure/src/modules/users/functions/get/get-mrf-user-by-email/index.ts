/* ---------- External ---------- */
import {
  ListUsersCommandInput,
  ListUsersCommand,
  UserType,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

const get_mrf_user_by_email = async (email: string) => {
  const params: ListUsersCommandInput = {
    UserPoolId: process.env.MRF_COGNITO_USERPOOL_ID,
    Filter: `"email"^="${email}"`,
    Limit: 1,
  };

  const command = new ListUsersCommand(params);

  const { Users } = await cognito_client.send(command);

  return Users as UserType[];
};

export { get_mrf_user_by_email };
