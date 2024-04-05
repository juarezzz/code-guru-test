/* ---------- External ---------- */
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

/* ---------- Constants ---------- */
import { polytag_brand_user_invite_email } from '_constants/email/polytag-brand-user-invite-email';

/* ---------- Interfaces ---------- */
interface SendPolytagBrandUserInviteEmailInput {
  email: string;
}

/* ---------- Function ---------- */
const send_polytag_brand_user_invite_email = async ({
  email,
}: SendPolytagBrandUserInviteEmailInput) => {
  const base_url = process.env.REDIRECT_URL as string;

  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: polytag_brand_user_invite_email({ base_url, email }),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Invitation to join Polytag',
      },
    },
    Source: 'noreply@polyt.ag',
  };

  const command = new SendEmailCommand(params);

  await ses_client.send(command);
};

/* ---------- Export ---------- */
export { send_polytag_brand_user_invite_email };
