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
export interface Count {
  gtin: string;
  count: number;
}

interface GetLabelsPrintedInput {
  range: string;
  gtins: string[];
}

/* ---------- Function ---------- */
const get_labels_printed = async ({ gtins, range }: GetLabelsPrintedInput) => {
  const labels_printed: Count[] = [];

  if (!gtins.length) return { labels_printed };

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = gtins.map(gtin => `'${gtin}'`).join(', ');

  const query_string = `
      SELECT gtin, SUM(measure_value::bigint)
      FROM ${table}
      WHERE measure_name = 'label_printed'
      AND gtin IN (${gtins_in})
      AND ${range}
      GROUP BY gtin
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
          const [{ ScalarValue: gtin }, { ScalarValue: value }] = row.Data;

          if (!gtin || !value) return;

          const count = Number(value);

          labels_printed.push({
            gtin,
            count,
          });
        }
      });

      next_token = NextToken;
    } while (next_token);
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { labels_printed };
    }

    throw new Error(error_message);
  }

  return { labels_printed };
};

/* ---------- Export ---------- */
export { get_labels_printed };
