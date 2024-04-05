/* ---------- External ---------- */
import { SQSEvent } from 'aws-lambda';

/* ---------- Modules ---------- */
import {
  create_labels,
  Parsed,
} from '_modules/sqs/functions/create/create-labels';
import {
  retry_create_labels,
  UnprocessedParsed,
} from '_modules/sqs/functions/create/retry-create-labels';

/* ---------- Interfaces ---------- */
type ParsedBody = Parsed | UnprocessedParsed;

/* ---------- Functions ---------- */
const is_unprocessed = (body: ParsedBody): body is UnprocessedParsed =>
  !!(body as UnprocessedParsed)?.unprocessed_items;

export const handler = async (event: SQSEvent) => {
  try {
    const { Records } = event;

    const [record] = Records;

    const { body } = record;

    const parsed = JSON.parse(body) as ParsedBody;

    console.log(
      `Message arrived in the dead-letter-queue: ${JSON.stringify(record)}`,
    );

    if (is_unprocessed(parsed)) await retry_create_labels(parsed);
    else await create_labels(parsed);
  } catch (err) {
    console.error(
      `An unexpected error occurred trying to process message: ${JSON.stringify(
        event,
      )}: `,
      err,
    );
  }
};
