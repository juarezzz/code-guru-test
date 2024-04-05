/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
export interface GetUniqueUsers {
  brand_id: string;
  gtins: string[];
  next_token?: string;
  product_groups: string[];
  range: string;
}

/* ---------- Function ---------- */
const get_unique_users = async ({
  brand_id,
  gtins,
  next_token,
  product_groups,
  range,
}: GetUniqueUsers) => {
  let unique_users = 0;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
    SELECT COUNT(
      DISTINCT(
        CONCAT(
          ip,
          languages,
          coalesce(screen_size, '0x0'),
          max_touch_points,
          hardware_concurrency,
          screen_size,
          user_agent
        )
      )
    )
    FROM ${table}
    WHERE
      measure_name = 'landing-page-scan'
    AND
      brand_id = '${brand_id}'
    AND
      ${range}
      ${gtins.length > 0 ? gtins_in : ''}
      ${product_groups.length > 0 ? product_groups_in : ''}
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
    NextToken: next_token,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows, NextToken } = await timestream_client_query.send(command);

    if (!Rows) return { unique_users };

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: count }] = row.Data;

        if (!count) return;

        const parsed_count = parseInt(count, 10);

        if (parsed_count === 0) return;

        unique_users += parsed_count;
      }
    });

    if (NextToken) {
      const { unique_users: extra_unique_users } = await get_unique_users({
        gtins,
        range,
        next_token: NextToken,
        brand_id,
        product_groups,
      });

      unique_users += extra_unique_users;
    }
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { unique_users };
    }

    throw new Error(error_message);
  }

  return { unique_users };
};

/* ---------- Export ---------- */
export { get_unique_users };
