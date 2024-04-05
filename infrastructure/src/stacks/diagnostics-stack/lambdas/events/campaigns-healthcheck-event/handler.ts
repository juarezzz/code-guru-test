/* ---------- External ---------- */
import { addDays, isAfter, isBefore, isToday } from 'date-fns';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';
import { difference, groupBy, sortBy } from 'lodash';

/* ---------- Helpers ---------- */
import { create_error_message } from '_helpers/general/create-error-message';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';
import { Campaign } from '_modules/campaigns/models';

/* ---------- Modules ---------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { send_internal_error_message } from '_stacks/diagnostics-stack/lambdas/events/campaigns-healthcheck-event/messages/send-internal-error-message';
import { create_campaigns_snapshot } from '../../../../../modules/campaigns-snapshot/create/create-campaigns-snapshot';
import { get_campaigns_snapshot } from '../../../../../modules/campaigns-snapshot/get/get-campaigns-snapshot';

/* ---------- Send Messages ---------- */
import { send_no_campaigns_error_message } from './messages/send-no-campaigns-error-message';
import { send_healthcheck_result_message } from './messages/send-healthcheck-result-message';
import { send_healthcheck_changes_message } from './messages/send-healthcheck-changes-message';

/* -------------- Functions -------------- */
import { get_all_campaigns } from './functions/get-all-campaigns';
import { format_timezone } from './functions/format_timezone';

export const handler = async (
  event: ScheduledEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  try {
    /* ----------
     * Fetching all campaigns
     * ---------- */
    const all_campaigns = await get_all_campaigns();

    /* ----------
     * If no active pages found,
     * notify the slack channel
     * ---------- */
    if (!all_campaigns.length) {
      await send_no_campaigns_error_message();
      return callback(null, event);
    }

    /* ----------
     * Find campaigns with
     * product groups and
     * active landing pages
     * ---------- */

    const current_date = format_timezone(new Date());

    const active_campaigns = all_campaigns.filter(campaign => {
      const active_landing_page = campaign.campaign_landing_pages.find(
        landing_page => {
          const { start_date, end_date } = landing_page;

          const start_date_utc = format_timezone(new Date(start_date));

          const end_date_utc = format_timezone(new Date(end_date));

          return (
            (isToday(start_date_utc) ||
              isBefore(start_date_utc, current_date)) &&
            (isToday(end_date_utc) || isAfter(end_date_utc, current_date))
          );
        },
      );
      return (
        !!active_landing_page && campaign.campaign_product_groups.length > 0
      );
    });

    /* ----------
     * Getting unique brands
     * ---------- */
    const unique_brands_id = new Set(
      all_campaigns.map(campaign => campaign.partition_key.split('#')[1]),
    );

    /* ----------
     * Retrieving the campaigns brands information
     * ---------- */
    const brands_promises = [...unique_brands_id].map(brand_id => {
      return get_brand({ brand_id });
    });

    const brands = (await Promise.all(brands_promises))
      .map(({ brand }) => brand)
      .filter(brand => brand) as Brand[];

    const active_campaigns_by_brand_name = groupBy(
      active_campaigns,
      campaign => {
        const campaign_brand = brands.find(
          brand =>
            brand.partition_key.split('#')[1] ===
            campaign.partition_key.split('#')[1],
        );
        return campaign_brand ? campaign_brand.brand_name : 'Brand not found';
      },
    );

    const brands_with_active_campaigns = Object.entries(
      active_campaigns_by_brand_name,
    ).map(([brand_name, campaigns]) => ({ brand_name, campaigns }));

    const brands_with_expiring_campaigns: {
      brand_name: string;
      num_of_campaigns_expiring: number;
    }[] = [];

    brands_with_active_campaigns.forEach(({ brand_name, campaigns }) => {
      let num_of_campaigns_expiring = 0;

      campaigns.forEach(({ campaign_landing_pages }) => {
        const sorted_landing_pages = sortBy(
          campaign_landing_pages,
          'start_date',
        );

        const current_lp_index = sorted_landing_pages.findIndex(lp => {
          const { start_date, end_date } = lp;

          const start_date_utc = format_timezone(new Date(start_date));

          const end_date_utc = format_timezone(new Date(end_date));

          return (
            (isToday(start_date_utc) ||
              isBefore(start_date_utc, current_date)) &&
            (isToday(end_date_utc) || isAfter(end_date_utc, current_date))
          );
        });

        const current_lp = sorted_landing_pages[current_lp_index];

        const is_expiring = isBefore(
          new Date(current_lp.end_date),
          addDays(current_date, 7),
        );

        const next_lp = sorted_landing_pages[current_lp_index + 1];

        if (
          is_expiring &&
          (!next_lp ||
            new Date(next_lp.start_date).getMilliseconds() !==
              new Date(current_lp.end_date).getMilliseconds())
        )
          num_of_campaigns_expiring += 1;
      });

      if (num_of_campaigns_expiring)
        brands_with_expiring_campaigns.push({
          brand_name,
          num_of_campaigns_expiring,
        });
    });

    const campaigns_snapshot = await get_campaigns_snapshot();

    const brands_with_campaign_changes: {
      brand_name: string;
      new_campaigns_length: number;
      old_campaigns_length: number;
    }[] = [];

    const new_brands_with_campaigns: {
      brand_name: string;
      campaigns: Campaign[];
    }[] = [];

    const new_brands_without_campaigns = [];

    if (campaigns_snapshot) {
      const { campaigns_data: old_campaigns_data } = campaigns_snapshot;

      brands_with_active_campaigns.forEach(({ brand_name, campaigns }) => {
        const old_campaign_data = old_campaigns_data.find(
          campaign_data => campaign_data.brand_name === brand_name,
        );

        if (!old_campaign_data) {
          new_brands_with_campaigns.push({
            brand_name,
            campaigns,
          });
          return;
        }

        if (campaigns.length !== old_campaign_data.campaigns.length)
          brands_with_campaign_changes.push({
            brand_name,
            new_campaigns_length: campaigns.length,
            old_campaigns_length: old_campaign_data.campaigns.length,
          });
      });

      const removed_campaigns = difference(
        old_campaigns_data.map(({ brand_name }) => brand_name),
        brands_with_active_campaigns.map(({ brand_name }) => brand_name),
      );

      new_brands_without_campaigns.push(...removed_campaigns);
    }

    await create_campaigns_snapshot({
      campaigns_data: brands_with_active_campaigns,
    });

    await send_healthcheck_result_message({
      brands_with_active_campaigns,
      brands_with_expiring_campaigns,
    });

    if (
      new_brands_with_campaigns.length ||
      new_brands_without_campaigns.length ||
      brands_with_campaign_changes.length
    ) {
      await send_healthcheck_changes_message({
        new_brands_with_campaigns,
        new_brands_without_campaigns,
        brands_with_campaign_changes,
      });
    }

    callback(null, event);
  } catch (error) {
    console.error(error);
    /* ----------
     * Sending error message to Slack
     * ---------- */
    await send_internal_error_message({
      internal_error_message: create_error_message(JSON.stringify(error)),
    });
  }

  return callback(null, event);
};
