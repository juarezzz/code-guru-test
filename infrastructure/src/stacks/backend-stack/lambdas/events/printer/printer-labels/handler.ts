/* ---------- External ---------- */
import { SQSEvent } from 'aws-lambda';

/* ---------- Modules ---------- */
import { create_labels } from '_modules/sqs/functions/create/create-labels';

export const handler = async (event: SQSEvent) => {
  try {
    const { Records } = event;

    const [record] = Records;

    const { body } = record;

    const parsed = JSON.parse(body);

    await create_labels(parsed);
  } catch (err) {
    console.error(`Message failed to be processed with error: `, err);
    console.log(`Message event: `, JSON.stringify(event));
    throw new Error();
  }
};
