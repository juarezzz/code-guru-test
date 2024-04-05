/* ---------- External ---------- */
import { SQSEvent } from 'aws-lambda';
import {
  RejectedRecordsException,
  WriteRecordsCommand,
  WriteRecordsCommandInput,
  _Record,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface Parsed {
  log_item: _Record;
}

export const handler = async (event: SQSEvent) => {
  const { Records } = event;

  const batch_item_failures: { itemIdentifier: string }[] = [];

  const timestream_records = Records.map(record => {
    const {
      body,
      attributes: { SentTimestamp: message_sent_timestamp },
    } = record;
    const { log_item } = JSON.parse(body) as Parsed;
    if (!log_item.Dimensions) return log_item;

    const send_message_duration =
      Number(message_sent_timestamp) -
      Number(log_item.Time) -
      Number(log_item.MeasureValue);

    log_item.Dimensions.push(
      {
        Name: 'saved_at',
        Value: new Date().toISOString(),
      },
      {
        Name: 'send_message_duration',
        Value: String(send_message_duration),
      },
    );

    // Include time it takes to send the message in the lambda duration
    log_item.MeasureValue = String(
      Number(log_item.MeasureValue) + send_message_duration,
    );

    return log_item;
  });

  const create_log_params: WriteRecordsCommandInput = {
    DatabaseName: process.env.TIMESTREAM_NAME,
    TableName: process.env.TIMESTREAM_NAME,
    Records: timestream_records,
  };

  const create_log_command = new WriteRecordsCommand(create_log_params);

  try {
    await timestream_client_write.send(create_log_command);
  } catch (e) {
    console.error('Error while inserting records in Timestream: ', e);
    if (e instanceof RejectedRecordsException && e.RejectedRecords)
      e.RejectedRecords.forEach(record => {
        const rejected_record = Records[record.RecordIndex ?? -1];
        return (
          rejected_record &&
          batch_item_failures.push({
            itemIdentifier: rejected_record.messageId,
          })
        );
      });
  }

  return { batchItemFailures: batch_item_failures };
};
