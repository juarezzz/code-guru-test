/* ---------- External ---------- */
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

/* ---------- Constants ---------- */
import { polytag_printer_user_invite_email } from '_constants/email/polytag-printer-invite-email';

/* ---------- Interfaces ---------- */
interface SendUserInviteEmailInput {
  email: string;
}

/* ---------- Function ---------- */
const send_printer_user_invite_email = async ({
  email,
}: SendUserInviteEmailInput) => {
  const base_url = process.env.REDIRECT_URL as string;

  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: polytag_printer_user_invite_email({ base_url, email }),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Invitation to create a Polytag Printer account',
      },
    },
    Source: 'noreply@polyt.ag',
  };

  const command = new SendEmailCommand(params);

  await ses_client.send(command);
};

/* ---------- Export ---------- */
export { send_printer_user_invite_email };
