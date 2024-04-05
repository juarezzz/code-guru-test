/* ---------- External ---------- */
import {
  WriteRecordsCommandInput,
  WriteRecordsCommand,
  TimeUnit,
  MeasureValueType,
  _Record,
} from '@aws-sdk/client-timestream-write';

/* ---------- Clients ---------- */
import { timestream_client_write } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface CreateThirdPartyRedeemLogInput {
  gtin: string;
  serial: string;
  third_party_id: string;
}

const create_third_party_redeem_log = async ({
  gtin,
  serial,
  third_party_id,
}: CreateThirdPartyRedeemLogInput) => {
  const log_item: _Record = {
    Time: String(Date.now()),
    TimeUnit: TimeUnit.MILLISECONDS,
    MeasureName: 'third_party_measure',
    MeasureValue: '1',
    MeasureValueType: MeasureValueType.BIGINT,
    Dimensions: [
      { Name: 'gtin', Value: gtin },
      { Name: 'serial', Value: serial },
      { Name: 'third_party_id', Value: third_party_id },
      { Name: 'data_type', Value: 'third_party_pre_redeem' },
    ],
  };

  const create_log_params: WriteRecordsCommandInput = {
    DatabaseName: process.env.TIMESTREAM_NAME,
    TableName: process.env.TIMESTREAM_NAME,
    Records: [log_item],
  };

  const create_log_command = new WriteRecordsCommand(create_log_params);

  await timestream_client_write.send(create_log_command);
};

/* ---------- Export ---------- */
export { create_third_party_redeem_log };
