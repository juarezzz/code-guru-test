/* ---------- External ---------- */
import { chunk } from 'lodash';
import { DynamoDB } from 'aws-sdk';

/* ---------- Types ---------- */
import { Handler } from '_stacks/backend-stack/lambdas/events/dynamodb-stream/@types';

/* ---------- Modules ---------- */
import { update_campaign } from '_modules/campaigns/functions/update/update-campaign';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_landing_page_associations } from '_modules/landing-pages/functions/get/get-landing-page-associations';

/* ---------- Models ---------- */
import { LandingPage } from '_modules/landing-pages/models';

export const handle_landing_page_modify: Handler = async ({ item }) => {
  try {
    const { OldImage } = item;

    const { NewImage } = item;

    if (!OldImage || !NewImage) return;

    const old_record = DynamoDB.Converter.unmarshall(OldImage) as LandingPage;

    const new_record = DynamoDB.Converter.unmarshall(NewImage) as LandingPage;

    const { partition_key, sort_key } = new_record;

    if (!partition_key || !sort_key) return;

    const brand_id = partition_key.replace('brand#', '');

    if (old_record.landing_page_name === new_record.landing_page_name) return;

    /* ----------
     * Fetch all campaigns associated with the landing page
     * ---------- */
    const campaign_associations = await get_landing_page_associations({
      brand_id,
      sort_key,
    });

    const promises: Promise<unknown>[] = [];

    for (const campaign_association of campaign_associations) {
      const campaign_id =
        campaign_association.sort_key.split('brand-campaign#')[1];

      const campaign_info = await get_campaign_by_sort_key({
        brand_id,
        campaign_sort_key: `brand-campaign#${campaign_id}`,
      });

      if (!campaign_info) continue;

      const updated_campaign_landing_pages =
        campaign_info.campaign_landing_pages.map(campaign_lp => {
          if (campaign_lp.landing_page_sort_key === sort_key) {
            return {
              ...campaign_lp,
              landing_page_name: new_record.landing_page_name,
            };
          }

          return campaign_lp;
        });

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
  } catch (err) {
    console.log('handle_landing_page_modify error: ', err);
  }
};
