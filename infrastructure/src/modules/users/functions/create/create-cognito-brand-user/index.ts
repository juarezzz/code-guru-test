/* ---------- External ---------- */
import {
  AdminAddUserToGroupCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface CreateCognitoBrandUserInput {
  email: string;
  roles: string[];
  password: string;
  brand_id: string;
}

/* ---------- Functions ---------- */
const create_cognito_brand_user = async ({
  roles,
  email,
  brand_id,
  password,
}: CreateCognitoBrandUserInput) => {
  const sign_up_command = new SignUpCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Password: password,
    Username: email,
    UserAttributes: [
      { Name: 'custom:full_name', Value: '' },
      { Name: 'custom:job_title', Value: '' },
      { Name: 'custom:brand_id', Value: brand_id },
    ],
  });

  const cognito_user = await cognito_client.send(sign_up_command);

  const add_to_group_commands = roles.map(
    group_name =>
      new AdminAddUserToGroupCommand({
        Username: email,
        GroupName: group_name,
        UserPoolId: process.env.COGNITO_USERPOOL_ID,
      }),
  );

  await Promise.all(
    add_to_group_commands.map(command => cognito_client.send(command)),
  );

  return { cognito_user };
};

export { create_cognito_brand_user };
