/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Models ---------- */
import { Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { get_product_by_gtin } from '_modules/products/functions/get/get-product-by-gtin';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';

/* ---------- Interfaces ---------- */
interface GetDisposalTopCampaignsInput {
  range: string;
  gtins: string[];
  brand_id: string;
}

interface TopProduct {
  gtin: string;
  count: number;
}

interface TopCampaign {
  count: number;
  campaign_id: string;
}

/* ---------- Constants ---------- */
const BATCH_SIZE = 25;

/* ---------- Function ---------- */
const get_disposal_top_campaigns = async ({
  range,
  gtins,
  brand_id,
}: GetDisposalTopCampaignsInput) => {
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
  `;

  try {
    const params: QueryCommandInput = {
      QueryString: query_string,
    };

    let next_token: string | undefined;

    do {
      params.NextToken = next_token;

      const command = new QueryCommand(params);

      const { Rows, NextToken } = await timestream_client_query.send(command);

      if (!Rows) {
        next_token = undefined;
        break;
      }

      Rows.forEach(row => {
        if (row.Data) {
          const [{ ScalarValue: gtin }, { ScalarValue: count }] = row.Data;

          if (!gtin || !count) return;

          top_products.push({
            gtin: String(Number(gtin)),
            count: Number(count),
          });
        }
      });

      next_token = NextToken;
    } while (next_token);
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return [];
    }

    throw new Error(error_message);
  }

  /* ----------
   * Lookup hashmaps used for
   * aggregating the results
   * ---------- */
  const gtin_to_group_sk: Record<string, string> = {};
  const group_sk_to_campaign_sk: Record<string, string> = {};
  const campaign_scan_count: Record<string, number> = {};

  /* ----------
   * Fetching all product groups sort keys from the gtins
   * ---------- */
  const products_list: Product[] = [];

  const get_products_commands = top_products.map(({ gtin }) => {
    return get_product_by_gtin({ gtin });
  });

  const get_products_commands_batches = chunk(
    get_products_commands,
    BATCH_SIZE,
  );

  for (const get_products_commands_batch of get_products_commands_batches) {
    const new_products = await Promise.all(get_products_commands_batch);

    const filtered_list = new_products.filter(({ product }) => {
      const valid = !!product && !!product.product_group_sort_key;

      const product_gtin = product?.sort_key?.split('#')[1];

      if (valid && product_gtin) {
        gtin_to_group_sk[product_gtin] = product.product_group_sort_key || '';
      }

      return valid;
    }) as {
      product: Product;
    }[];

    products_list.push(...filtered_list.map(({ product }) => product));
  }

  const product_groups_sort_keys = new Set(
    products_list.map(
      ({ product_group_sort_key }) => product_group_sort_key,
    ) as string[],
  );

  /* ----------
   * Fetching all campaign IDs
   * ---------- */
  const get_groups_commands = [...product_groups_sort_keys].map(group_sk => {
    return get_product_group_by_sort_key({
      brand_id,
      product_group_sort_key: group_sk,
    });
  });

  const get_groups_commands_batches = chunk(get_groups_commands, BATCH_SIZE);

  for (const get_groups_commands_batch of get_groups_commands_batches) {
    const new_groups = await Promise.all(get_groups_commands_batch);

    new_groups.forEach(group => {
      const valid = !!group && !!group.assigned_campaign_sort_key;

      if (valid && group?.sort_key) {
        group_sk_to_campaign_sk[group.sort_key] =
          group.assigned_campaign_sort_key || '';
      }
    });
  }

  /* ----------
   * Grouping and accumulating the top campaigns
   * based on the products scan count
   * ---------- */
  top_products.forEach(({ gtin, count }) => {
    const product_group = gtin_to_group_sk[gtin];

    if (!product_group) return;

    const product_campaign = group_sk_to_campaign_sk[product_group];

    if (!product_campaign) return;

    const campaign_id = product_campaign.split('#')[1];

    if (!campaign_scan_count[campaign_id]) {
      campaign_scan_count[campaign_id] = count;
    } else {
      campaign_scan_count[campaign_id] += count;
    }
  });

  const top_campaigns: TopCampaign[] = Object.entries(campaign_scan_count)
    .map(([campaign_id, count]) => ({ campaign_id, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return top_campaigns;
};

/* ---------- Export ---------- */
export { get_disposal_top_campaigns };
