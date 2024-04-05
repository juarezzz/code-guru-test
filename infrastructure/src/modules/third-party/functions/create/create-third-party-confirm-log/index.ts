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

/* ---------- Helpers ---------- */
import { safe_parse_number_to_string } from '_helpers/utils/safe-parse-number-to-string';

/* ---------- Interfaces ---------- */
export interface LocationInfo {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  country_code?: string;
}

interface CreateThirdPartyConfirmLogInput {
  gtin: string;
  serial: string;
  third_party_id: string;
  location?: LocationInfo;
}

const create_third_party_confirm_log = async ({
  gtin,
  serial,
  location,
  third_party_id,
}: CreateThirdPartyConfirmLogInput) => {
  const confirm_log_item: _Record = {
    Time: String(Date.now()),
    TimeUnit: TimeUnit.MILLISECONDS,
    MeasureName: 'third_party_measure',
    MeasureValue: '1',
    MeasureValueType: MeasureValueType.BIGINT,
    Dimensions: [
      { Name: 'gtin', Value: gtin },
      { Name: 'serial', Value: serial },
      { Name: 'third_party_id', Value: third_party_id },
      { Name: 'data_type', Value: 'third_party_redeem' },

      { Name: 'city', Value: location?.city || 'not-set' },
      { Name: 'country', Value: location?.country || 'not-set' },
      { Name: 'country_code', Value: location?.country_code || 'not-set' },
      {
        Name: 'latitude',
        Value: safe_parse_number_to_string(location?.latitude),
      },
      {
        Name: 'longitude',
        Value: safe_parse_number_to_string(location?.longitude),
      },
    ],
  };

  const create_log_params: WriteRecordsCommandInput = {
    DatabaseName: process.env.TIMESTREAM_NAME,
    TableName: process.env.TIMESTREAM_NAME,
    Records: [confirm_log_item],
  };

  const create_log_command = new WriteRecordsCommand(create_log_params);

  await timestream_client_write.send(create_log_command);
};

/* ---------- Export ---------- */
export { create_third_party_confirm_log };
