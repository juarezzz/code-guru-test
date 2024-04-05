/* ---------- External ---------- */
import _ from 'lodash';
import {
  WriteRecordsCommandInput,
  MeasureValueType,
  TimeUnit,
  _Record,
  WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write';

/* ---------- Helpers ---------- */
import { get_random_date_from_range } from '_helpers/utils/get-random-date-from-range';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Types ---------- */
import { GenerateQRPrintsInput } from '_helpers/analytics/generate-qr-prints/@types';

/* ---------- Constants ---------- */
const TIMESTREAM_BATCH_SIZE = 25;

/* ---------- Functions ---------- */
export const generate_qr_prints = async ({
  product_details,
  end_date,
  start_date,
  amount,
}: GenerateQRPrintsInput) => {
  /* ----------
   * Generates new records for each QR print
   * ---------- */

  const new_records: _Record[] = Array(amount)
    .fill({})
    .map(() => {
      const timestamp = get_random_date_from_range({ start_date, end_date });

      return {
        Dimensions: [{ Name: 'gtin', Value: product_details.product_id }],
        MeasureName: 'label_printed',
        MeasureValueType: MeasureValueType.BIGINT,
        MeasureValue: '1',
        Time: String(timestamp.getTime()),
        TimeUnit: TimeUnit.MILLISECONDS,
      };
    });

  /* ----------
   * Inserts the new records in batches
   * ---------- */

  const records_batches = _.chunk(new_records, TIMESTREAM_BATCH_SIZE);

  for (const batch of records_batches) {
    const insert_params: WriteRecordsCommandInput = {
      DatabaseName: process.env.TIMESTREAM_NAME,
      TableName: process.env.TIMESTREAM_NAME,
      Records: batch,
    };

    const insert_command = new WriteRecordsCommand(insert_params);

    await timestream_client_write.send(insert_command);
  }
};
