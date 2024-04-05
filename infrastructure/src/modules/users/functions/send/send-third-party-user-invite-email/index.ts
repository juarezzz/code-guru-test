/* ---------- External ---------- */
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

/* ---------- Constants ---------- */
import { polytag_third_party_user_invite_email } from '_constants/email/polytag-third-party-invite-email';

/* ---------- Interfaces ---------- */
interface SendMRFUserInviteEmailInput {
  email: string;
}

/* ---------- Function ---------- */
const send_third_party_user_invite_email = async ({
  email,
}: SendMRFUserInviteEmailInput) => {
  const base_url = process.env.REDIRECT_URL as string;

  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: polytag_third_party_user_invite_email({ base_url, email }),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Invitation to create a Polytag third-party account',
      },
    },
    Source: 'noreply@polyt.ag',
  };

  const command = new SendEmailCommand(params);

  await ses_client.send(command);
};

/* ---------- Export ---------- */
export { send_third_party_user_invite_email };
