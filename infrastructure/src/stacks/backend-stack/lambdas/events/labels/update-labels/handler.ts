/* ---------- External ---------- */
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { SQSEvent } from 'aws-lambda';

/* ---------- Modules ---------- */
import { update_third_party_label } from '_modules/third-party/functions/update/update-third-party-label';
import { Label } from '_modules/label/models';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';

/* ---------- Constants ---------- */
const { LABELS_QUEUE_URL } = process.env;

const MAX_FAILED_ATTEMPTS = 10;

/* ---------- Interfaces ---------- */
type ParsedBody = { label: Label; failed_attempts?: number };

export const handler = async (event: SQSEvent) => {
  const { Records } = event;

  const [record] = Records;

  const { body } = record;

  const parsed_body = JSON.parse(body) as ParsedBody;

  try {
    const { label } = parsed_body;

    if (!label) throw Error('Missing label on message body');

    await update_third_party_label({ label });
  } catch (err) {
    console.error(
      `An unexpected error occurred trying to process message at labels queue: ${JSON.stringify(
        event,
      )}: `,
      err,
    );

    const { failed_attempts } = parsed_body;

    const updated_failed_attempts = (failed_attempts ?? 0) + 1;

    if (updated_failed_attempts > MAX_FAILED_ATTEMPTS) {
      console.log(
        `Could not process message after ${MAX_FAILED_ATTEMPTS} attempts. Message body: ${JSON.stringify(
          event,
        )}`,
      );

      return;
    }

    const params: SendMessageCommandInput = {
      MessageBody: JSON.stringify({
        ...parsed_body,
        failed_attempts: updated_failed_attempts,
      }),
      QueueUrl: LABELS_QUEUE_URL,
      DelaySeconds: 5 * updated_failed_attempts,
    };

    const command = new SendMessageCommand(params);

    await sqs_client.send(command);
  }
};
