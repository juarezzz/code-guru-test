/* ---------- External ---------- */
import {
  ResendConfirmationCodeCommand,
  ResendConfirmationCodeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface SendVerificationEmailInput {
  email: string;
}

/* ---------- Function ---------- */
const send_verification_email = async ({
  email,
}: SendVerificationEmailInput) => {
  const params: ResendConfirmationCodeCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
  };

  const command = new ResendConfirmationCodeCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { send_verification_email };
