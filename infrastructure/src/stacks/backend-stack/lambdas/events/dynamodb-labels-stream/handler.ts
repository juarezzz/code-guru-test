/* ---------- External ---------- */
import { DynamoDBStreamEvent } from 'aws-lambda';

/* ---------- Types ---------- */
import { Failure } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/@types';

/* ---------- Handlers ---------- */
import { handle_printer_labels_request_modify } from '_stacks/backend-stack/lambdas/events/dynamodb-labels-stream/handlers/printer-labels-request/handler-printer-labels-request-modify';

export const handler = async (
  event: DynamoDBStreamEvent,
): Promise<void | Failure> => {
  /* ---------- Controller ---------- */
  let sequence_number: string | undefined;

  const { Records } = event;

  try {
    for (const record of Records) {
      sequence_number = record.dynamodb?.SequenceNumber;

      if (record.dynamodb && record.dynamodb.Keys) {
        if (record.eventName === 'MODIFY') {
          await handle_printer_labels_request_modify({
            item: record.dynamodb,
          });
        }
      }
    }

    return undefined;
  } catch (err) {
    console.error(err);
    console.info('Failure: ', sequence_number);

    return { batchItemFailures: [{ itemIdentifier: sequence_number }] };
  }
};
