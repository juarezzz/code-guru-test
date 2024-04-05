/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  RejectedRecordsException,
  WriteRecordsCommand,
  _Record,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';
import { nanoid } from 'nanoid';

/* ---------- Interfaces ---------- */
interface Serial {
  gtin: string;
  sub: string;
  brand_id: string;
  serial: string;
  request_id?: string;
}

/* ---------- Function ---------- */
const create_label_printed_records = async (serials: Serial[]) => {
  const rejected_records: _Record[] = [];
  const records = new Map<string, _Record>();
  const records_count = new Map<string, number>();

  serials.forEach(serial => {
    const { gtin, request_id } = serial;

    if (records.has(gtin) && records_count.has(gtin)) {
      const updated_count = (records_count.get(gtin) ?? 0) + 1;
      const current_record = records.get(gtin);

      records.set(gtin, {
        ...current_record,
        MeasureValue: `${updated_count}`,
      });

      records_count.set(gtin, updated_count);
    } else {
      records.set(gtin, {
        Dimensions: [
          {
            Name: 'gtin',
            Value: gtin.toString(),
          },
          {
            Name: 'batch_id',
            Value: nanoid(),
          },
          ...(request_id ? [{ Name: 'request_id', Value: request_id }] : []),
        ],
        MeasureName: 'label_printed',
        MeasureValue: '1',
        MeasureValueType: 'BIGINT',
        Time: new Date().getTime().toString(),
        TimeUnit: 'MILLISECONDS',
      });

      records_count.set(gtin, 1);
    }
  });

  const records_array = Array.from(records.values());

  const records_batches = chunk(records_array, 100);

  for (const records_batch of records_batches) {
    try {
      const params = {
        DatabaseName: process.env.TIMESTREAM_NAME,
        TableName: process.env.TIMESTREAM_NAME,
        Records: records_batch,
      };
      const write_command = new WriteRecordsCommand(params);
      await timestream_client_write.send(write_command);
    } catch (e) {
      console.error('Error while inserting records in Timestream: ', e);
      if (e instanceof RejectedRecordsException && e.RejectedRecords)
        e.RejectedRecords.forEach(record => {
          const rejected_record = records_batch[record.RecordIndex ?? -1];
          return rejected_record && rejected_records.push(rejected_record);
        });
    }
  }

  return rejected_records;
};

/* ---------- Export ---------- */
export { create_label_printed_records };
