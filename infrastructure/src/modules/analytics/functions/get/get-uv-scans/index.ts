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
export interface Scan {
  gtin: string;
  count: number;
}

interface GetUVScansInput {
  range: string;
  gtins: string[];
}

/* ---------- Function ---------- */
const get_uv_scans = async ({ gtins, range }: GetUVScansInput) => {
  const uv_scans: Scan[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;

  const query_string = `
    SELECT gtin, SUM(measure_value::bigint) as count
    FROM ${table}
    WHERE measure_name = 'uv-scans'
    AND ${range}
    ${gtins.length ? gtins_in : ''}
    GROUP BY gtin
    ORDER BY count DESC
  `;

  let next_token: QueryCommandOutput['NextToken'] | undefined;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  do {
    params.NextToken = next_token;

    const command = new QueryCommand(params);

    try {
      const { Rows, NextToken } = await timestream_client_query.send(command);

      Rows?.forEach(row => {
        if (!row.Data) return;

        const [{ ScalarValue: gtin }, { ScalarValue: count }] = row.Data;

        if (!gtin || !count) return;

        uv_scans.push({
          gtin,
          count: Number(count),
        });
      });

      next_token = NextToken;
    } catch (error) {
      const { message: error_message } =
        error as TimestreamQueryServiceException;

      if (error_message.endsWith('does not exist')) {
        return { uv_scans };
      }

      throw new Error(error_message);
    }
  } while (next_token);

  return { uv_scans };
};

/* ---------- Export ---------- */
export { get_uv_scans };
