/* ---------- External ---------- */
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

/* ---------- Models ---------- */
import { ContactFormField } from '_modules/brand-contact/models';

/* ---------- Constants ---------- */
import { polytag_brand_user_invite_email } from '_constants/email/polytag-contact-form-email';

/* ---------- Interfaces ---------- */
interface SendEmailMessageInput {
  persona: string;
  receivers: string[];
  fields: ContactFormField[];
}

/* ---------- Function ---------- */
const send_email_message = async ({
  fields,
  persona,
  receivers,
}: SendEmailMessageInput) => {
  const params: SendEmailCommandInput = {
    Destination: {
      ToAddresses: receivers,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: polytag_brand_user_invite_email({ fields, persona }),
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'New message received - Polytag',
      },
    },
    Source: 'noreply@polyt.ag',
  };

  const command = new SendEmailCommand(params);

  return ses_client.send(command);
};

/* ---------- Export ---------- */
export { send_email_message };
