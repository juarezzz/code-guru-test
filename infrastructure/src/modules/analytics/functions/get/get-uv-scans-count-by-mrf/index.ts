/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface GetUVScansCountByMRFInput {
  range: string;
  gtins: string[];
}

interface UVScansByMRF {
  count: number;
  mrf_id: string;
}

/* ---------- Function ---------- */
const get_uv_scans_count_by_mrf = async ({
  range,
  gtins,
}: GetUVScansCountByMRFInput) => {
  let scans: UVScansByMRF[] = [];

  if (!gtins.length) return { scans };

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;

  const query_string = `
    SELECT SUM(measure_value::BIGINT) as count, mrf_id
    FROM ${table}
    WHERE measure_name = 'uv-scans'
    ${gtins.length ? gtins_in : ''}
    AND ${range}
    GROUP BY mrf_id
    ORDER BY count DESC
  `;

  try {
    const params: QueryCommandInput = {
      QueryString: query_string,
    };

    let next_token: QueryCommandOutput['NextToken'] | undefined;

    do {
      params.NextToken = next_token;

      const command = new QueryCommand(params);

      const { Rows, NextToken } = await timestream_client_query.send(command);

      Rows?.forEach(row => {
        if (row.Data) {
          const [{ ScalarValue: count }, { ScalarValue: mrf_id }] = row.Data;

          if (!count || !mrf_id) return;

          scans.push({
            mrf_id,
            count: Number(count),
          });
        }
      });

      next_token = NextToken;
    } while (next_token);
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { scans };
    }

    throw new Error(error_message);
  }

  return { scans };
};

/* ---------- Export ---------- */
export { get_uv_scans_count_by_mrf };
