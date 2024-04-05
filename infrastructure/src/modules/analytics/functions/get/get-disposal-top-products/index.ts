/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface GetDisposalTopProductsInput {
  range: string;
  gtins: string[];
}

interface TopProduct {
  gtin: string;
  count: number;
}

/* ---------- Function ---------- */
const get_disposal_top_products = async ({
  range,
  gtins,
}: GetDisposalTopProductsInput) => {
  const top_products: TopProduct[] = [];

  if (!gtins.length) return top_products;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = gtins.map(gtin => String(Number(gtin))).join(', ');

  const query_string = `
    SELECT
      gtin, SUM(measure_value::bigint) AS count
    FROM ${table}
    WHERE measure_name = 'third_party_measure'
    AND data_type = 'third_party_redeem'
    AND CAST(gtin AS bigint) IN (${gtins_in})
    AND ${range}
    GROUP BY gtin
    ORDER BY count DESC
    LIMIT 5
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows } = await timestream_client_query.send(command);

    if (!Rows) return [];

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: gtin }, { ScalarValue: count }] = row.Data;

        if (!gtin || !count) return;

        top_products.push({
          count: Number(count),
          gtin: String(Number(gtin)),
        });
      }
    });
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return top_products;
    }

    throw new Error(error_message);
  }

  return top_products;
};

/* ---------- Export ---------- */
export { get_disposal_top_products };
