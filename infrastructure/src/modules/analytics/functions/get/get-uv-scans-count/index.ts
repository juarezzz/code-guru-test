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
interface GetUVScansCountInput {
  range: string;
  gtins: string[];
}

/* ---------- Function ---------- */
const get_uv_scans_count = async ({ range, gtins }: GetUVScansCountInput) => {
  let scans = 0;

  if (!gtins.length) return scans;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;

  const query_string = `
    SELECT SUM(measure_value::BIGINT) as total
    FROM ${table}
    WHERE measure_name = 'uv-scans'
    ${gtins.length ? gtins_in : ''}
    AND ${range}
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
          const [{ ScalarValue }] = row.Data;

          if (!ScalarValue) return;

          scans += Number(ScalarValue);
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
export { get_uv_scans_count };
