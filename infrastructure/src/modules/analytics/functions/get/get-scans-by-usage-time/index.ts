/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
export interface GetScansByUsageTime {
  next_token?: string;
  range: string;
  gtins: string[];
  product_groups: string[];
  brand_id: string;
}

export interface GetScansByUsageTimeOutput {
  usage: number;
  city: string;
}

/* ---------- Function ---------- */
const get_scans_by_usage_time = async ({
  gtins,
  range,
  next_token,
  brand_id,
  product_groups,
}: GetScansByUsageTime) => {
  const scans_by_usage_time: GetScansByUsageTimeOutput[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
      SELECT date_diff('second', min(time), max(time)) AS usage, city
      FROM ${table}
      WHERE measure_name = 'landing-page-scan'
        AND brand_id = '${brand_id}'
        AND ${range}
        ${gtins.length > 0 ? gtins_in : ''}
        ${product_groups.length > 0 ? product_groups_in : ''}
      ORDER BY
        usage
      GROUP BY
        city
      DESC
    `;

  const params: QueryCommandInput = {
    QueryString: query_string,
    NextToken: next_token,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows, NextToken } = await timestream_client_query.send(command);

    if (!Rows) return { scans_by_usage_time };

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: usage }, { ScalarValue: city }] = row.Data;

        if (!usage || !city) return;

        const parsed_usage = parseInt(usage, 10);

        if (parsed_usage === 0) return;

        scans_by_usage_time.push({
          usage: parsed_usage,
          city: decodeURIComponent(city),
        });
      }
    });

    if (NextToken) {
      const { scans_by_usage_time: extra_scans_by_usage_time } =
        await get_scans_by_usage_time({
          gtins,
          range,
          next_token: NextToken,
          brand_id,
          product_groups,
        });

      scans_by_usage_time.push(...extra_scans_by_usage_time);
    }
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { scans_by_usage_time };
    }

    throw new Error(error_message);
  }

  return { scans_by_usage_time };
};

/* ---------- Export ---------- */
export { get_scans_by_usage_time };
