/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { increase_brand_product_groups_count } from '_modules/brands/functions/update/increase-brand-product-groups-count';

/* ---------- Models ---------- */
import { ProductGroup } from '_modules/product-groups/models';

/* ---------- Helpers ---------- */
import { dissociate_products } from '_helpers/recursive-functions/dissociate-products';
import { dissociate_product_group_from_campaign } from '_modules/product-groups/functions/update/dissociate-product-group-from-campaign';

export const handle_product_group_deletion = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  /* ----------
   * Check validity of the item
   * then parse the data into all needed fields
   * ---------- */
  const { OldImage } = item;

  if (!OldImage) return;

  const product_group = DynamoDB.Converter.unmarshall(OldImage) as ProductGroup;

  const { partition_key, sort_key, assigned_campaign_sort_key } = product_group;

  if (!partition_key || !sort_key) return;

  const brand_id = partition_key.replace('brand#', '');
  const product_group_sort_key = sort_key;
  const campaign_sort_key = assigned_campaign_sort_key;

  if (!brand_id || !product_group_sort_key) return;

  /* ----------
   * Deassign the product group from the campaign
   * ---------- */
  if (campaign_sort_key)
    await dissociate_product_group_from_campaign({
      brand_id,
      campaign_sort_key,
      product_group_sort_key,
    });

  /* ----------
   * Deassign all products from the product group
   * ---------- */

  await Promise.all([
    dissociate_products({
      partition_key,
      product_group_sort_key,
    }),

    increase_brand_product_groups_count({
      brand_id,
      amount: -1,
    }),
  ]);
};
