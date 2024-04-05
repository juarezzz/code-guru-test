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
import { GenerateUVScansInput } from '_helpers/analytics/generate-uv-scans/@types';

/* ---------- Constants ---------- */
const TIMESTREAM_BATCH_SIZE = 25;

/* ---------- Functions ---------- */
export const generate_uv_scans = async ({
  product_details,
  end_date,
  start_date,
  amount,
  mrf_id,
}: GenerateUVScansInput) => {
  /* ----------
   * Creates a list of new records
   * to be added to Timestream
   * ---------- */

  const new_records: _Record[] = Array(amount)
    .fill({})
    .map(() => {
      const timestamp = get_random_date_from_range({ start_date, end_date });

      return {
        Dimensions: [
          { Name: 'mrf_id', Value: mrf_id },
          { Name: 'data_type', Value: 'mrf_scans' },
          { Name: 'gtin', Value: product_details.product_id },
          { Name: 'originated_from', Value: 'cron_job' },
        ],
        MeasureName: 'count_measure',
        MeasureValueType: MeasureValueType.VARCHAR,
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
