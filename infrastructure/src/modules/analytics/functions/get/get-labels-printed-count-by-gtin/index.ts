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
interface GetLabelsPrintedByGtinInput {
  range: string;
  gtins: string[];
}

interface LabelsPrintedByGtin {
  gtin: string;
  count: number;
}

/* ---------- Function ---------- */
const get_labels_printed_count_by_gtin = async ({
  range,
  gtins,
}: GetLabelsPrintedByGtinInput) => {
  let labels_printed: LabelsPrintedByGtin[] = [];

  if (!gtins.length) return { labels_printed };

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;

  const query_string = `
    SELECT SUM(measure_value::BIGINT) as count, gtin
    FROM ${table}
    WHERE measure_name = 'label_printed'
    ${gtins.length ? gtins_in : ''}
    AND ${range}
    GROUP BY gtin
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
          const [{ ScalarValue: count }, { ScalarValue: gtin }] = row.Data;

          if (!count || !gtin) return;

          labels_printed.push({
            gtin,
            count: Number(count),
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
export { get_labels_printed_count_by_gtin };
