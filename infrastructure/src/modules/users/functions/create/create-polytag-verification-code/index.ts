/* ---------- External ---------- */
import {
  ResendConfirmationCodeCommand,
  ResendConfirmationCodeCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Types ---------- */
import { CreatePolytagVerificationCodeInput } from '_modules/users/functions/create/create-polytag-verification-code/@types';

/* ---------- Function ---------- */
const create_polytag_verification_code = async ({
  email,
}: CreatePolytagVerificationCodeInput) => {
  const params: ResendConfirmationCodeCommandInput = {
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email,
  };

  const command = new ResendConfirmationCodeCommand(params);

  await cognito_client.send(command);
};

/* ---------- Export ---------- */
export { create_polytag_verification_code };
