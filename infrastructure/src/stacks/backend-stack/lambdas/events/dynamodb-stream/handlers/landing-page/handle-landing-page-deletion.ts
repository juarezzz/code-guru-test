/* ---------- External ---------- */
import { chunk } from 'lodash';
import { DynamoDB } from 'aws-sdk';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Types ---------- */
import { Handler } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/@types';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Modules ---------- */
import { update_campaign } from '_modules/campaigns/functions/update/update-campaign';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_landing_page_associations } from '_modules/landing-pages/functions/get/get-landing-page-associations';
import { increase_brand_landing_pages_count } from '_modules/brands/functions/update/increase-brand-landing-pages-count';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

export const handle_landing_page_deletion: Handler = async ({ item }) => {
  try {
    const { OldImage } = item;

    if (!OldImage) return;

    const record = DynamoDB.Converter.unmarshall(OldImage) as LandingPage;

    const { partition_key, sort_key } = record;

    if (!partition_key || !sort_key) return;

    const brand_id = partition_key.replace('brand#', '');

    /* ----------
     * Fetch all campaigns associated with the landing page
     * ---------- */
    const campaign_associations = await get_landing_page_associations({
      brand_id,
      sort_key,
    });

    const promises: Promise<unknown>[] = [];

    for (const campaign_association of campaign_associations) {
      const delete_association_command = new DeleteCommand({
        Key: {
          partition_key: brand_id,
          sort_key: campaign_association.sort_key,
        },
        TableName: process.env.TABLE_NAME,
      });

      const delete_association_promise = dynamodb_documentclient.send(
        delete_association_command,
      );

      promises.push(delete_association_promise);

      const campaign_id =
        campaign_association.sort_key.split('brand-campaign#')[1];

      const campaign_info = await get_campaign_by_sort_key({
        brand_id,
        campaign_sort_key: `brand-campaign#${campaign_id}`,
      });

      if (!campaign_info) continue;

      const updated_campaign_landing_pages =
        campaign_info.campaign_landing_pages.filter(
          campaign_lp => campaign_lp.landing_page_sort_key !== sort_key,
        );

      const update_campaign_promise = update_campaign({
        brand_id,
        campaign_sort_key: campaign_info.sort_key,
        campaign_name: campaign_info.campaign_name,
        campaign_landing_pages: updated_campaign_landing_pages,
        campaign_product_groups: campaign_info.campaign_product_groups,
      });

      promises.push(update_campaign_promise);

      const promises_chunks = chunk(promises, 25);

      for (const promises_chunk of promises_chunks) {
        await Promise.all(promises_chunk);
      }
    }

    await increase_brand_landing_pages_count({
      brand_id,
      amount: -1,
    });
  } catch (err) {
    console.log('handle_landing_page_deletion error: ', err);
  }
};
