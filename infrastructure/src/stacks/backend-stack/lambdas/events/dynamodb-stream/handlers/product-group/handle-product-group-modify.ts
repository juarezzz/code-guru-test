/* ---------- External ---------- */
import { StreamRecord } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

/* ---------- Modules ---------- */
import { get_all_product_associations_to_product_group } from '_modules/products/functions/get/get-all-product-associations-to-product-group';
import { update_product } from '_modules/products/functions/update/update-product';
import { get_all_campaigns } from '_modules/campaigns/functions/get/get-all-campaigns';
import { update_campaign } from '_modules/campaigns/functions/update/update-campaign';

/* ---------- Models ---------- */
import { ProductGroup } from '_modules/product-groups/models';

export const handle_product_group_modify = async ({
  item,
}: {
  item: StreamRecord;
}) => {
  try {
    const { NewImage, OldImage } = item;

    if (!OldImage || !NewImage) return;

    const old_product_group = DynamoDB.Converter.unmarshall(
      OldImage,
    ) as ProductGroup;
    const new_product_group = DynamoDB.Converter.unmarshall(
      NewImage,
    ) as ProductGroup;

    if (
      old_product_group.product_group_name ===
      new_product_group.product_group_name
    )
      return;

    const brand_id = old_product_group.partition_key.replace('brand#', '');

    let last_key: Record<string, unknown> | undefined;

    do {
      const {
        product_to_product_group_associations,
        last_evaluated_key: products_associations_last_evaluated_key,
      } = await get_all_product_associations_to_product_group({
        brand_id,
        product_group_sort_key: old_product_group.sort_key,
        last_key,
      });
      last_key = products_associations_last_evaluated_key;

      if (!product_to_product_group_associations) continue;

      await Promise.all(
        product_to_product_group_associations.map(async product_association => {
          const sort_key_parts = product_association.sort_key.split('#');
          const product_group_sk = `brand-product-group#${sort_key_parts[1].replace(
            'brand-product',
            '',
          )}`;
          const product_sk = `brand-product#${sort_key_parts[2]}`;
          await update_product({
            brand_id,
            product_sort_key: product_sk,
            product_group_sort_key: product_group_sk,
            product_group_name: new_product_group.product_group_name,
          });
        }),
      );
    } while (last_key);

    let campaigns_last_evaluated_key: string | undefined;

    do {
      const {
        campaigns: campaigns_items,
        last_evaluated_key: campaigns_last_key,
      } = await get_all_campaigns({
        brand_id,
        last_key: campaigns_last_evaluated_key,
      });

      campaigns_last_evaluated_key = campaigns_last_key;

      const filtered_campaign = campaigns_items.filter(campaign =>
        campaign.campaign_product_groups.some(
          pg => pg.product_group_sort_key === old_product_group.sort_key,
        ),
      );

      if (filtered_campaign.length === 0) continue;

      const campaign_item_to_update = filtered_campaign[0];
      if (!campaign_item_to_update) continue;

      const campaign_id =
        campaign_item_to_update.sort_key.split('brand-campaign#')[1];
      if (!campaign_id) continue;

      const updated_campaign_groups =
        campaign_item_to_update.campaign_product_groups.map(pg => ({
          ...pg,
          product_group_name:
            pg.product_group_sort_key === old_product_group.sort_key
              ? new_product_group.product_group_name
              : pg.product_group_name,
        }));

      await update_campaign({
        brand_id,
        campaign_landing_pages: campaign_item_to_update.campaign_landing_pages,
        campaign_name: campaign_item_to_update.campaign_name,
        campaign_sort_key: campaign_item_to_update.sort_key,
        campaign_product_groups: updated_campaign_groups,
      });
    } while (campaigns_last_evaluated_key);
  } catch (err) {
    console.log('handle_product_group_modify error: ', err);
  }
};
