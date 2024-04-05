/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';
import { ProductToGroupAssociation } from '_modules/products/models/product-to-product-group-association';

/* ---------- Modules ---------- */
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_display_pages_by_gtin } from '_modules/display-page/functions/get/get-display-pages-by-gtin';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';
import { delete_display_page_by_sort_key } from '_modules/display-page/functions/delete/delete-display-page-by-sort-key';
import { increment_products_count as increment_pg_products_count } from '_modules/product-groups/functions/update/increment-products-count';
import { increment_products_count as increment_campaign_products_count } from '_modules/campaigns/functions/update/increment-products-count';

/* ---------- Interfaces ---------- */
interface HandleProductToProductGroupDissociationInput {
  item: StreamRecord;
}

/* ---------- Functions ---------- */
const handle_product_to_product_group_dissociation = async ({
  item,
}: HandleProductToProductGroupDissociationInput) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = unmarshall(
      OldImage as Record<string, AttributeValue>,
    ) as ProductToGroupAssociation;

    const { partition_key, sort_key } = record;

    if (!partition_key || !sort_key) return;

    const brand_id = partition_key.replace('brand#', '');
    const product_group_sort_key = sort_key.split('brand-product#')[0];
    const product_gtin = sort_key.split('brand-product#')[1];
    const product_sort_key = `brand-product#${product_gtin}`;

    if (!brand_id || !product_group_sort_key || !product_sort_key) return;

    /* ----------
     * 1. Fetching all display pages
     * associated with the group's products
     * ---------- */
    const display_pages_to_delete: DisplayPage[] = [];

    const get_all_product_display_pages_promise = async () => {
      let last_key: Record<string, unknown> | undefined;

      do {
        const { last_evaluated_key, display_pages } =
          await get_display_pages_by_gtin({
            last_key,
            gtin: product_gtin,
          });

        display_pages_to_delete.push(...display_pages);

        last_key = last_evaluated_key;
      } while (last_key);
    };

    /* ----------
     * 2. Fetching the product group itself
     * ---------- */
    const get_product_group_promise = get_product_group_by_sort_key({
      brand_id,
      product_group_sort_key,
    });

    const [product_group] = await Promise.all([
      get_product_group_promise,
      get_all_product_display_pages_promise(),
    ]);

    /* ----------
     * 3. Decreasing the group's products count
     * ---------- */
    const promises = [
      increment_pg_products_count({
        brand_id,
        product_group_sort_key,
        value: -1,
      }),
    ];

    /* ----------
     * 4. Deleting associated display pages
     * ---------- */
    const delete_display_pages_promises = display_pages_to_delete.map(
      ({ sort_key: display_page_sort_key }) =>
        delete_display_page_by_sort_key({
          brand_id,
          display_page_sort_key,
        }),
    );

    promises.push(...delete_display_pages_promises);

    /* ----------
     * 5. Removing group entry from campaign
     * ---------- */
    if (product_group && product_group.assigned_campaign_sort_key) {
      const product_group_campaign = await get_campaign_by_sort_key({
        brand_id,
        campaign_sort_key: product_group.assigned_campaign_sort_key,
      });

      if (product_group_campaign) {
        const product_group_index =
          product_group_campaign.campaign_product_groups.findIndex(
            ({ product_group_sort_key: current_pg_sk }) =>
              current_pg_sk === product_group_sort_key,
          );

        if (product_group_index !== -1) {
          const increment_products_count_promise =
            increment_campaign_products_count({
              brand_id,
              value: -1,
              product_group_index,
              campaign_sort_key: product_group_campaign.sort_key,
            });

          promises.push(increment_products_count_promise);
        }
      }
    }

    await Promise.allSettled(promises);
  } catch (err) {
    console.error('error at handle_product_to_product_group_dissociation:');
    console.error(err);
  }
};

/* ---------- Exports ---------- */
export { handle_product_to_product_group_dissociation };
