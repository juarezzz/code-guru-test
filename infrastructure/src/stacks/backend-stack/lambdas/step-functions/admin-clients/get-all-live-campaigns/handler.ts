/* ---------- External ---------- */
import { addDays, isAfter, parse } from 'date-fns';

/* ---------- Modules ---------- */
import { get_all_campaigns } from '_modules/campaigns/functions/get/get-all-campaigns';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const { campaigns, last_evaluated_key } = await get_all_campaigns({
      brand_id: event.brand_id,
      last_key: event.live_campaigns_last_evaluated_key,
    });

    let count = 0;

    for (const campaign of campaigns) {
      const { campaign_landing_pages, campaign_product_groups } = campaign;

      if (!campaign_landing_pages || campaign_landing_pages.length === 0)
        continue;

      const last_campaign =
        campaign_landing_pages[campaign_landing_pages.length - 1];

      if (!last_campaign) continue;

      const { end_date, start_date } = last_campaign;

      const formatted_end_date = parse(end_date, 'yyyy-MM-dd', new Date());
      const formatted_start_date = parse(start_date, 'yyyy-MM-dd', new Date());
      const day_to_end = addDays(formatted_end_date, 1);
      const future_campaign = isAfter(formatted_start_date, new Date());

      if (
        isAfter(new Date(), day_to_end) ||
        campaign_product_groups.length === 0 ||
        future_campaign
      )
        continue;

      count += 1;
    }

    const client: Clients = {
      ...event,
      live_campaigns_last_evaluated_key: last_evaluated_key,
      live_campaigns_count: event.live_campaigns_count + count,
    };

    return { client, all_live_campaigns_fetch: !last_evaluated_key };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
