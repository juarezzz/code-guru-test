/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Types ---------- */
export interface GetTopCampaigns {
  product_groups: string[];
  range: string;
  brand_id: string;
  gtins: string[];
}

export interface GetTopCampaignsOutput {
  campaign_id: string;
  total: number;
}

/* ---------- Function ---------- */
const get_top_campaigns = async ({
  product_groups,
  range,
  brand_id,
  gtins,
}: GetTopCampaigns) => {
  const top_campaigns: GetTopCampaignsOutput[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
    SELECT
      COALESCE(campaign_id, 'no-campaign'),
      count(*) AS total
    FROM ${table}
    WHERE measure_name = 'landing-page-scan'
    AND brand_id = '${brand_id}'
    AND ${range}
    ${gtins.length > 0 ? gtins_in : ''}
    ${product_groups.length > 0 ? product_groups_in : ''}
    GROUP BY campaign_id
    ORDER BY total DESC
    LIMIT 5
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows } = await timestream_client_query.send(command);

    if (!Rows) return { top_campaigns };

    Rows.forEach(row => {
      if (row.Data) {
        const [{ ScalarValue: campaign_id }, { ScalarValue: total }] = row.Data;

        if (!campaign_id || !total) return;

        top_campaigns.push({
          campaign_id,
          total: +Number(total),
        });
      }
    });
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { top_campaigns };
    }

    throw new Error(error_message);
  }

  return { top_campaigns };
};

/* ---------- Export ---------- */
export { get_top_campaigns };
