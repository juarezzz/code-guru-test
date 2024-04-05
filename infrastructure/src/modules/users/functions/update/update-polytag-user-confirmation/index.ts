/* ---------- External ---------- */
import {
  AdminConfirmSignUpCommand,
  AdminUpdateUserAttributesCommand,
  ConfirmSignUpCommand,
  ConfirmSignUpCommandInput,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Helpers ---------- */
import { httpError } from '_helpers/errors/httpError';

/* ---------- Constants ---------- */
import { TEST_ALLOWED_EMAILS } from '_constants/test/allowed_emails';

/* ---------- Interfaces ---------- */
interface UpdatePolytagUserConfirmationInput {
  email: string;
  code: string;
}

/* ---------- Function ---------- */
const update_polytag_user_confirmation = async ({
  code,
  email,
}: UpdatePolytagUserConfirmationInput) => {
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

    const verify_email_command = new AdminUpdateUserAttributesCommand({
      Username: list_result.Users[0].Username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
      UserAttributes: [
        {
          Name: 'email_verified',
          Value: 'true',
        },
      ],
    });

    const confirm_command = new AdminConfirmSignUpCommand({
      Username: list_result.Users[0].Username,
      UserPoolId: process.env.COGNITO_USERPOOL_ID,
    });

    await Promise.all([
      cognito_client.send(confirm_command),
      cognito_client.send(verify_email_command),
    ]);

    return;
  }

  const params: ConfirmSignUpCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    ConfirmationCode: code,
    Username: email,
  };

  const command = new ConfirmSignUpCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { update_polytag_user_confirmation };
