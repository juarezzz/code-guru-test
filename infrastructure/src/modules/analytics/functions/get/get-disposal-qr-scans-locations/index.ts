/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';
import { inRange } from 'lodash';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Function ---------- */
interface GetDisposalQRScansLocationsInput {
  range: string;
  gtins: string[];
}

interface DisposalQRScansLocation {
  city: string;
  count: number;
  latitude?: number;
  longitude?: number;
}

/* ---------- Constants ---------- */
// This range ensures only locations from Europe will be shown on the maps
const LATITUDE_RANGE = [36, 71] as const;
const LONGITUDE_RANGE = [-25, 40] as const;

/* ---------- Function ---------- */
const get_disposal_qr_scans_locations = async ({
  gtins,
  range,
}: GetDisposalQRScansLocationsInput) => {
  const disposal_qr_scans_locations: DisposalQRScansLocation[] = [];

  if (!gtins.length) return disposal_qr_scans_locations;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = gtins.map(gtin => String(Number(gtin))).join(', ');

  const query_string = `
    SELECT city,
      ELEMENT_AT(
        ARRAY_SORT(ARRAY_AGG(CAST(longitude AS DOUBLE))),
        CAST(CEIL(CAST(CARDINALITY(ARRAY_AGG(longitude)) AS DOUBLE) / 2) AS BIGINT)
      ) as longitude,
      ELEMENT_AT(
        ARRAY_SORT(ARRAY_AGG(CAST(latitude AS DOUBLE))),
        CAST(CEIL(CAST(CARDINALITY(ARRAY_AGG(latitude)) AS DOUBLE) / 2) AS BIGINT)
      ) as latitude,
      SUM(measure_value::bigint) as count
    FROM ${table}
    WHERE measure_name = 'third_party_measure'
    AND data_type = 'third_party_redeem'
    AND CAST(gtin AS bigint) IN (${gtins_in})
    AND ${range}
    AND city != 'not-set'
    AND (
      COALESCE(TRY_CAST(longitude AS DOUBLE), 0) != 0
      AND COALESCE(TRY_CAST(latitude AS DOUBLE), 0) != 0
    )
    GROUP by city
  `;

  try {
    const params: QueryCommandInput = {
      QueryString: query_string,
    };

    let next_token: string | undefined;

    do {
      params.NextToken = next_token;

      const command = new QueryCommand(params);

      const { Rows, NextToken } = await timestream_client_query.send(command);

      if (!Rows) {
        next_token = undefined;
        break;
      }

      Rows.forEach(row => {
        if (row.Data) {
          const [
            { ScalarValue: city },
            { ScalarValue: longitude },
            { ScalarValue: latitude },
            { ScalarValue: count },
          ] = row.Data;

          if (!latitude || !longitude || !city || !count) return;

          disposal_qr_scans_locations.push({
            city,
            count: Number(count),
            latitude: inRange(Number(latitude), ...LATITUDE_RANGE)
              ? Number(latitude)
              : undefined,
            longitude: inRange(Number(longitude), ...LONGITUDE_RANGE)
              ? Number(longitude)
              : undefined,
          });
        }
      });

      next_token = NextToken;
    } while (next_token);
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return disposal_qr_scans_locations;
    }

    throw new Error(error_message);
  }

  return disposal_qr_scans_locations;
};

/* ---------- Export ---------- */
export { get_disposal_qr_scans_locations };
