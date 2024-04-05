/* ---------- External ---------- */
import {
  ForgotPasswordCommand,
  ForgotPasswordCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Interfaces ---------- */
interface SendForgotPasswordEmailInput {
  email: string;
}

/* ---------- Function ---------- */
const send_forgot_password_email = async ({
  email,
}: SendForgotPasswordEmailInput) => {
  const params: ForgotPasswordCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
  };

  const command = new ForgotPasswordCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { send_forgot_password_email };
