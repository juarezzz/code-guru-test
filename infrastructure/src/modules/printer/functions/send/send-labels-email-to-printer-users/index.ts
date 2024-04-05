/* ---------- External ---------- */
import { chunk } from 'lodash';
import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

/* ---------- Clients ---------- */
import { ses_client } from '_clients/ses';

/* ---------- Models ---------- */
import { LabelsRequest } from '_modules/label/models/labels-request';

/* ---------- Modules ---------- */
import { get_all_printer_users } from '_modules/users/functions/get/get-all-printer-users';

/* ---------- Emails ---------- */
import { polytag_printer_labels_email } from '_constants/email/polytag-printer-labels-email';

/* ---------- Interfaces ---------- */
interface SendLabelsEmailToPrinterUsersInput {
  printer_id: string;
  download_url: string;
  request_info: LabelsRequest;
}

/* ---------- Function ---------- */
const send_labels_email_to_printer_users = async ({
  printer_id,
  download_url,
  request_info,
}: SendLabelsEmailToPrinterUsersInput) => {
  let last_key: string | undefined;

  do {
    const { printer_users, last_evaluated_key } = await get_all_printer_users({
      last_key,
      printer_id,
    });

    const users_batches = chunk(printer_users, 10);

    for (const users_batch of users_batches) {
      const commands = users_batch.map(user => {
        const email_params: SendEmailCommandInput = {
          Destination: {
            ToAddresses: [user.email],
          },
          Message: {
            Body: {
              Html: {
                Charset: 'UTF-8',
                Data: polytag_printer_labels_email({
                  download_url,
                  request_info,
                }),
              },
            },
            Subject: {
              Charset: 'UTF-8',
              Data: 'Your serialised codes are ready!',
            },
          },
          Source: 'noreply@polyt.ag',
        };

        return new SendEmailCommand(email_params);
      });

      await Promise.all(commands.map(command => ses_client.send(command)));
    }

    last_key = last_evaluated_key;
  } while (last_key);
};

/* ---------- Export ---------- */
export { send_labels_email_to_printer_users };
