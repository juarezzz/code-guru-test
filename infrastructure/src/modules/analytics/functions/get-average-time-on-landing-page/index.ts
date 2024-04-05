/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Types ---------- */
interface GetAverageTimeOnLandingPage {
  next_token?: string;
  range: string;
  gtins: string[];
  product_groups: string[];
  brand_id: string;
}

/* ---------- Function ---------- */
const get_average_time_on_landing_page = async ({
  gtins,
  range,
  next_token,
  brand_id,
  product_groups,
}: GetAverageTimeOnLandingPage) => {
  const average_time_on_landing_page: number[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
    SELECT AVG(measure_value::bigint) as average_time_on_landing_page
    FROM ${table}
    WHERE measure_name = 'landing-page-scan'
      AND brand_id = '${brand_id}'
      ${gtins.length > 0 ? gtins_in : ''}
      ${product_groups.length > 0 ? product_groups_in : ''}
      AND ${range}
      AND landing_page_id IS NOT NULL
      AND measure_value::bigint <= 180000
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
    NextToken: next_token,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows, NextToken } = await timestream_client_query.send(command);

    if (!Rows) return { average_time_on_landing_page };

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: average_time_on_landing_page_result }] = row.Data;

        if (!average_time_on_landing_page_result) return;

        average_time_on_landing_page.push(
          Number(average_time_on_landing_page_result),
        );
      }
    });

    if (NextToken) {
      const {
        average_time_on_landing_page: extra_average_time_on_landing_page,
      } = await get_average_time_on_landing_page({
        gtins,
        next_token: NextToken,
        range,
        brand_id,
        product_groups,
      });

      average_time_on_landing_page.push(...extra_average_time_on_landing_page);
    }
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { average_time_on_landing_page };
    }

    throw new Error(error_message);
  }

  return { average_time_on_landing_page };
};

/* ---------- Export ---------- */
export { get_average_time_on_landing_page };
