/* ---------- External ---------- */
import { Record } from 'aws-sdk/clients/timestreamwrite';

/* ---------- Utils ---------- */
import { generate_random_int } from '__scripts/utils/generate-random-int';

/* ---------- Types ---------- */
import { GTIN } from '__scripts/choices/write-timestream-data/@types';

export const generate_label = async (date: string, gtin: GTIN) => {
  const start_date = new Date(date).getTime();
  const end_date = new Date(date).getTime() + 86399999;

  const timestamp = generate_random_int(start_date, end_date);

  const record: Record = {
    Dimensions: [
      {
        Name: 'gtin',
        Value: gtin.gtin,
      },
    ],
    MeasureName: 'label_printed',
    MeasureValueType: 'BIGINT',
    MeasureValue: '1',
    Time: String(timestamp),
    TimeUnit: 'MILLISECONDS',
  };

  return record;
};
