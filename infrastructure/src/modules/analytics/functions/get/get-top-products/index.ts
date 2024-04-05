/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Modules ---------- */
export interface GetTopProducts {
  product_groups: string[];
  range: string;
  brand_id: string;
  gtins: string[];
}

export interface GetTopProductsOutput {
  gtin: string;
  gtin_count: number;
}

/* ---------- Function ---------- */
const get_top_products = async ({
  gtins,
  range,
  brand_id,
  product_groups,
}: GetTopProducts) => {
  const top_products: GetTopProductsOutput[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
    SELECT
      gtin, count(gtin) as gtin_count
    FROM
      ${table}
    WHERE
      measure_name = 'landing-page-scan'
    AND
      brand_id = '${brand_id}'
    AND
      ${range}
      ${gtins.length > 0 ? gtins_in : ''}
      ${product_groups.length > 0 ? product_groups_in : ''}
    GROUP BY
      gtin
    ORDER BY
      gtin_count
    DESC
    LIMIT
      5
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows } = await timestream_client_query.send(command);

    if (!Rows) return { top_products };

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: gtin }, { ScalarValue: gtin_count }] = row.Data;

        if (!gtin || !gtin_count) return;

        top_products.push({
          gtin,
          gtin_count: Number(gtin_count),
        });
      }
    });
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { top_products };
    }

    throw new Error(error_message);
  }

  return { top_products };
};

/* ---------- Export ---------- */
export { get_top_products };
