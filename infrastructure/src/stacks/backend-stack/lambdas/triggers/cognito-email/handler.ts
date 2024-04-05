/* ---------- External ---------- */
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import {
  buildClient,
  CommitmentPolicy,
  KmsKeyringNode,
} from '@aws-crypto/client-node';

/* ---------- Types ---------- */
import { AWS } from '__@types';

/* ---------- Emails ---------- */
import { polytag_brand_forgot_password_email } from '_constants/email/polytag-brand-forgot-password-email';
import { polytag_brand_resend_verification_code_email } from '_constants/email/polytag-brand-resend-verification-code-email';
import { polytag_brand_sign_up_email } from '_constants/email/polytag-brand-signup-email';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

export const handler = async (
  event: AWS.CognitoLambdaTrigger,
): Promise<void> => {
  const { decrypt } = buildClient(
    CommitmentPolicy.REQUIRE_ENCRYPT_ALLOW_DECRYPT,
  );

  const arn = process.env.KMS_KEY_ARN?.split(':key')[0];
  const generatorKeyId = `${arn}:alias/cognito`;
  const keyIds = [process.env.KMS_KEY_ARN as string];

  const keyring = new KmsKeyringNode({
    generatorKeyId,
    keyIds,
  });

  try {
    const { plaintext } = await decrypt(
      keyring,
      Buffer.from(event.request.code, 'base64'),
    );
    const { email } = event.request.userAttributes;

    const params: SendEmailCommandInput = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: '',
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: '',
        },
      },
      Source: 'noreply@polyt.ag',
    };

    if (event.triggerSource === 'CustomEmailSender_SignUp') {
      params.Message = {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Welcome aboard! Here is your verification code from Polytag.',
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: polytag_brand_sign_up_email({
              email,
              six_digit_code: plaintext.toString('utf8'),
            }),
          },
        },
      };
    } else if (event.triggerSource === 'CustomEmailSender_ResendCode') {
      params.Message = {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Welcome aboard! Here is your verification code from Polytag.',
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: polytag_brand_resend_verification_code_email({
              email,
              six_digit_code: plaintext.toString('utf8'),
            }),
          },
        },
      };
    } else if (event.triggerSource === 'CustomEmailSender_ForgotPassword') {
      params.Message = {
        Subject: {
          Charset: 'UTF-8',
          Data: 'Forgot your password? Here is your code from Polytag.',
        },
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: polytag_brand_forgot_password_email({
              email,
              six_digit_code: plaintext.toString('utf8'),
            }),
          },
        },
      };
    } else if (
      event.triggerSource === 'CustomEmailSender_UpdateUserAttribute'
    ) {
      // Nope
    } else if (
      event.triggerSource === 'CustomEmailSender_VerifyUserAttribute'
    ) {
      // Nope
    } else if (event.triggerSource === 'CustomEmailSender_AdminCreateUser') {
      // Nope
    } else if (
      event.triggerSource === 'CustomEmailSender_AccountTakeOverNotification'
    ) {
      // Nope
    }

    if (params.Message?.Body?.Html?.Data) {
      const command = new SendEmailCommand(params);

      await ses_client.send(command);
    }
  } catch (err) {
    console.error(err);
  }
};
