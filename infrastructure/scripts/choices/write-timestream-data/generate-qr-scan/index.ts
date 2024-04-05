/* ---------- External ---------- */
import { _Record } from '@aws-sdk/client-timestream-write';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Utils ---------- */
import { generate_random_int } from '__scripts/utils/generate-random-int';

/* ---------- Types ---------- */
import {
  GTIN,
  User,
  PingData,
} from '__scripts/choices/write-timestream-data/@types';

/* ---------- Interfaces ---------- */
interface Navigator {
  measure_name: string;
  'measure_value::varchar': string;
  time: string;
}

export const generate_qr_scan = async (
  date: string,
  gtin: GTIN,
  user: User,
) => {
  const uuid = uuidv4();
  const start_date = new Date(date).getTime();
  const end_date = new Date(date).getTime() + 86399999;
  const timestamp = generate_random_int(start_date, end_date);
  const dweel_time = generate_random_int(1, 30);

  const initial = {
    ...user.initial,
    'measure_value::varchar': uuid,
    time: String(timestamp),
  };

  const navigator = {
    ...user.navigator,
    'measure_value::varchar': uuid,
    time: String(timestamp + 2000),
  };

  const pings: PingData[] = [];

  for (let j = 0; j < dweel_time; j += 3) {
    pings.push({
      type: 'ping',
      measure_name: 'label_measure',
      time: String(timestamp + 1000 + j * 1000),
      'measure_value::varchar': uuid,
    });
  }

  const pings_entries = pings.map(ping => {
    return {
      Dimensions: Object.keys(ping)
        .filter(
          l => !['measure_name', 'measure_value::varchar', 'time'].includes(l),
        )
        .map(key => ({
          Name: key,
          Value: ping[key as keyof PingData],
        })),
      MeasureName: ping.measure_name,
      MeasureValueType: 'VARCHAR',
      MeasureValue: ping['measure_value::varchar'],
      Time: ping.time,
      TimeUnit: 'MILLISECONDS',
    };
  });

  const scans: _Record[] = [
    {
      Dimensions: Object.keys(initial)
        .filter(
          l => !['measure_name', 'measure_value::varchar', 'time'].includes(l),
        )
        .map(key => ({
          Name: key,
          Value: initial[key as keyof typeof initial],
        })),
      MeasureName: initial.measure_name,
      MeasureValue: initial['measure_value::varchar'],
      MeasureValueType: 'VARCHAR',
      Time: initial.time,
      TimeUnit: 'MILLISECONDS',
    },
    {
      Dimensions: Object.keys(navigator)
        .filter(
          l => !['measure_name', 'measure_value::varchar', 'time'].includes(l),
        )
        .map(key => ({
          Name: key,
          Value: navigator[key as keyof Navigator],
        })),
      MeasureName: navigator.measure_name,
      MeasureValueType: 'VARCHAR',
      MeasureValue: navigator['measure_value::varchar'],
      Time: navigator.time,
      TimeUnit: 'MILLISECONDS',
    },
    ...pings_entries,
  ];

  return scans;
};
