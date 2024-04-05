/* ---------- External ---------- */
import {
  WriteRecordsCommandInput,
  WriteRecordsCommand,
  TimeUnit,
  MeasureValueType,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface CreateThirdPartyScanLogInput {
  gtin: string;
  serial: string;
  third_party_id: string;
}

const create_third_party_scan_log = async ({
  gtin,
  serial,
  third_party_id,
}: CreateThirdPartyScanLogInput) => {
  const create_log_params: WriteRecordsCommandInput = {
    DatabaseName: process.env.TIMESTREAM_NAME,
    TableName: process.env.TIMESTREAM_NAME,
    Records: [
      {
        Time: String(Date.now()),
        TimeUnit: TimeUnit.MILLISECONDS,
        MeasureName: 'third_party_measure',
        MeasureValue: '1',
        MeasureValueType: MeasureValueType.BIGINT,
        Dimensions: [
          { Name: 'gtin', Value: gtin },
          { Name: 'serial', Value: serial },
          { Name: 'data_type', Value: 'third_party_scan' },
          { Name: 'third_party_id', Value: third_party_id },
        ],
      },
    ],
  };

  const create_log_command = new WriteRecordsCommand(create_log_params);

  await timestream_client_write.send(create_log_command);
};

/* ---------- Export ---------- */
export { create_third_party_scan_log };
