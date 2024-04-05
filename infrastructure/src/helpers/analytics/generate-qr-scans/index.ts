/* ---------- External ---------- */
import _ from 'lodash';
import { Chance } from 'chance';
import { v4 as uuidV4 } from 'uuid';
import { addSeconds } from 'date-fns';
import {
  WriteRecordsCommandInput,
  MeasureValueType,
  TimeUnit,
  _Record,
  WriteRecordsCommand,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Helpers ---------- */
import { generate_random_user } from '_helpers/analytics/generate-random-user';
import { get_random_date_from_range } from '_helpers/utils/get-random-date-from-range';

/* ---------- Types ---------- */
import { User } from '_helpers/analytics/generate-random-user/@types';
import {
  GenerateQRScansInput,
  PingData,
} from '_helpers/analytics/generate-qr-scans/@types';

/* ---------- Constants ---------- */
const PING_INTERVAL_SEC = 3;
const TIMESTREAM_BATCH_SIZE = 25;
const NON_DIMENSION_KEYS = ['measure_name', 'measure_value::varchar', 'time'];

/* ---------- Functions ---------- */
export const generate_qr_scans = async ({
  product_details,
  end_date,
  start_date,
  amount,
}: GenerateQRScansInput) => {
  const chance = Chance();

  const new_records: _Record[] = [];

  const users: User[] = Array(amount)
    .fill({})
    .map(() => generate_random_user({ product_details }));

  /* ----------
   * Generates new records for each user and also creates
   * ping records based on the randomized dwell time
   * ---------- */

  for (const user of users) {
    const timestamp = get_random_date_from_range({ start_date, end_date });
    const dwell_time = chance.integer({ min: 1, max: 30 });
    const user_pings: PingData[] = [];
    const uuid = uuidV4();

    const user_initial = {
      ...user.initial,
      'measure_value::varchar': uuid,
      time: String(timestamp.getTime()),
    };

    const user_navigator = {
      ...user.navigator,
      'measure_value::varchar': uuid,
      time: String(addSeconds(timestamp, 2).getTime()),
    };

    for (let index = 0; index < dwell_time; index += PING_INTERVAL_SEC) {
      user_pings.push({
        data_type: 'label_scan_ping',
        measure_name: 'label_measure',
        time: String(addSeconds(timestamp, index).getTime()),
        'measure_value::varchar': uuid,
      });
    }

    const ping_entries = user_pings.map(ping => {
      const Dimensions = Object.entries(ping)
        .filter(([key]) => !NON_DIMENSION_KEYS.includes(key))
        .map(([key, value]) => {
          return {
            Name: key,
            Value: value,
          };
        });

      return {
        Dimensions,
        MeasureName: ping.measure_name,
        MeasureValueType: MeasureValueType.VARCHAR,
        MeasureValue: ping['measure_value::varchar'],
        Time: ping.time,
        TimeUnit: TimeUnit.MILLISECONDS,
      };
    });

    const initial_dimensions = Object.entries(user_initial)
      .filter(([key]) => !NON_DIMENSION_KEYS.includes(key))
      .map(([key, value]) => ({
        Name: key,
        Value: value,
      }));

    const navigator_dimensions = Object.entries(user_navigator)
      .filter(([key]) => !NON_DIMENSION_KEYS.includes(key))
      .map(([key, value]) => ({
        Name: key,
        Value: value,
      }));

    new_records.push(
      ...[
        {
          Dimensions: initial_dimensions,
          MeasureName: user_initial.measure_name,
          MeasureValue: user_initial['measure_value::varchar'],
          MeasureValueType: MeasureValueType.VARCHAR,
          Time: user_initial.time,
          TimeUnit: TimeUnit.MILLISECONDS,
        },

        {
          Dimensions: navigator_dimensions,
          MeasureName: user_navigator.measure_name,
          MeasureValue: user_navigator['measure_value::varchar'],
          MeasureValueType: MeasureValueType.VARCHAR,
          Time: user_navigator.time,
          TimeUnit: TimeUnit.MILLISECONDS,
        },

        ...ping_entries,
      ],
    );
  }

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
