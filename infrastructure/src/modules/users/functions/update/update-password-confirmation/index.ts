/* ---------- External ---------- */
import {
  ListUsersCommand,
  AdminSetUserPasswordCommand,
  ConfirmForgotPasswordCommand,
  ConfirmForgotPasswordCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Constants ---------- */
import { TEST_ALLOWED_EMAILS } from '_constants/test/allowed_emails';

/* ---------- Helpers ---------- */
import { httpError } from '_helpers/errors/httpError';

/* ---------- Interfaces ---------- */
interface UpdatePasswordConfirmationInput {
  email: string;
  code: string;
  password: string;
}

/* ---------- Function ---------- */
const update_password_confirmation = async ({
  email,
  code,
  password,
}: UpdatePasswordConfirmationInput) => {
  if (
    process.env.ENVIRONMENT?.toLowerCase() === 'test' &&
    TEST_ALLOWED_EMAILS.includes(email) &&
    code === '123456'
  ) {
    const list_command = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
      Filter: `email = "${email}"`,
      Limit: 1,
    });

    const list_result = await cognito_client.send(list_command);

    if (!list_result.Users?.length) {
      throw new Error(
        httpError({
          message: "Couldn't find user with provided email.",
          status_code: 404,
        }),
      );
    }

    const change_password_command = new AdminSetUserPasswordCommand({
      Password: password,
      Username: list_result.Users[0].Username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
      Permanent: true,
    });

    await cognito_client.send(change_password_command);

    return;
  }

  const params: ConfirmForgotPasswordCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: password,
  };

  const command = new ConfirmForgotPasswordCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { update_password_confirmation };
