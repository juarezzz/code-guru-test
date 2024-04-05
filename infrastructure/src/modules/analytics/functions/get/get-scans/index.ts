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
interface GetScans {
  range: string;
  gtins?: string[];
  brand_id?: string;
  product_groups?: string[];
}
/* ---------- Function ---------- */
const get_scans = async ({
  range,
  gtins,
  brand_id,
  product_groups,
}: GetScans) => {
  let scans = 0;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins
    ?.map(gtin => `'${gtin}'`)
    .join(', ')})`;

  const product_groups_list = product_groups
    ?.map(pg => `'${pg.replace('brand-product-group#', '')}'`)
    .join(', ');

  const product_groups_in = `AND product_group_id IN (${product_groups_list})`;

  const query_string = `
    SELECT count(*) as total
    FROM ${table}
    WHERE measure_name = 'landing-page-scan'
    ${brand_id ? `AND brand_id = '${brand_id}'` : ''}
    ${(gtins?.length || 0) > 0 ? gtins_in : ''}
    ${(product_groups_list?.length || 0) > 0 ? product_groups_in : ''}
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
export { get_scans };
