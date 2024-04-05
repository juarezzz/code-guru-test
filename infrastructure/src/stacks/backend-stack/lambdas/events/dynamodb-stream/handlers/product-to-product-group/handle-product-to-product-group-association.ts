/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

/* ---------- Models ---------- */
import { ProductToGroupAssociation } from '_modules/products/models/product-to-product-group-association';

/* ---------- Modules ---------- */
import { create_display_page } from '_modules/display-page/functions/create/create-display-page';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';
import { increment_products_count as increment_pg_products_count } from '_modules/product-groups/functions/update/increment-products-count';
import { increment_products_count as increment_campaign_products_count } from '_modules/campaigns/functions/update/increment-products-count';

/* ---------- Interfaces ---------- */
interface HandleProductToProductGroupAssociationInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_product_to_product_group_association = async ({
  item,
}: HandleProductToProductGroupAssociationInput) => {
  try {
    const { NewImage } = item;

    if (!NewImage) return;

    const record = unmarshall(
      NewImage as Record<string, AttributeValue>,
    ) as ProductToGroupAssociation;

    const { partition_key, sort_key } = record;

    if (!partition_key || !sort_key) return;

    const brand_id = partition_key.replace('brand#', '');
    const product_group_sort_key = sort_key.split('brand-product#')[0];
    const product_sort_key = `brand-product#${
      sort_key.split('brand-product#')[1]
    }`;

    if (!brand_id || !product_group_sort_key || !product_sort_key) return;

    /* ----------
     * 1. Fetching the product group and
     * checking if it still exists
     * ---------- */
    const product_group = await get_product_group_by_sort_key({
      brand_id,
      product_group_sort_key,
    });

    if (!product_group) return;

    /* ----------
     * 2. Incremeting the product
     * group's product count
     * ---------- */
    const promises: Promise<unknown>[] = [
      increment_pg_products_count({
        value: 1,
        brand_id,
        product_group_sort_key,
      }),
    ];

    /* ----------
     * 3. Checking if the product group is assigned to a
     * campaign and then updating the products count and
     * creating display pages for all the landing pages
     * ---------- */
    if (product_group.assigned_campaign_sort_key) {
      const product_group_campaign = await get_campaign_by_sort_key({
        brand_id,
        campaign_sort_key: product_group.assigned_campaign_sort_key,
      });

      if (product_group_campaign) {
        const product_id = product_sort_key.split('#')[1];
        const product_group_id = product_group.sort_key.split('#')[1];
        const campaign_id = product_group_campaign.sort_key.split('#')[1];

        const create_display_pages_promises =
          product_group_campaign.campaign_landing_pages.map(
            ({ landing_page_sort_key, start_date, end_date }) =>
              create_display_page({
                brand_id,
                end_date,
                start_date,
                product_id,
                campaign_id,
                product_group_id,
                landing_page_id: landing_page_sort_key.split('#')[1],
              }),
          );

        promises.push(...create_display_pages_promises);

        const product_group_index =
          product_group_campaign.campaign_product_groups.findIndex(
            ({ product_group_sort_key: current_pg_sk }) =>
              current_pg_sk === product_group_sort_key,
          );

        if (product_group_index !== -1) {
          const increment_products_count_promise =
            increment_campaign_products_count({
              brand_id,
              value: 1,
              product_group_index,
              campaign_sort_key: product_group_campaign.sort_key,
            });

          promises.push(increment_products_count_promise);
        }
      }
    }

    await Promise.all(promises);
  } catch (err) {
    console.error('error at handle_product_to_product_group_association:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_product_to_product_group_association };
