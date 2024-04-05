/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
interface SendTestSuccessMessageInput {
  new_brands_with_campaigns: { brand_name: string; campaigns: Campaign[] }[];
  new_brands_without_campaigns: string[];
  brands_with_campaign_changes: {
    brand_name: string;
    new_campaigns_length: number;
    old_campaigns_length: number;
  }[];
}

/* ---------- Function ---------- */
const send_healthcheck_changes_message = async ({
  new_brands_with_campaigns,
  new_brands_without_campaigns,
  brands_with_campaign_changes,
}: SendTestSuccessMessageInput) => {
  const unix_time = getUnixTime(new Date());
  const test_date = new Date()
    .toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    })
    .toUpperCase();

  const blocks: unknown[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `Campaigns Changes - ${test_date}`,
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
  ];

  if (new_brands_with_campaigns.length)
    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':star: New active brands: ',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${new_brands_with_campaigns
            .sort((a, b) =>
              a.brand_name.toLowerCase() > b.brand_name.toLowerCase() ? 1 : -1,
            )
            .map(
              ({ brand_name, campaigns }) =>
                `*${brand_name}*: ${campaigns.length} active campaign(s)`,
            )
            .join('\n')}`,
        },
      },
    );

  if (new_brands_without_campaigns.length)
    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':eyes: New inactive brands: ',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${new_brands_without_campaigns
            .sort((a, b) => (a.toLowerCase() > b.toLowerCase() ? 1 : -1))
            .map(brand_name => `*${brand_name}*`)
            .join('\n')}`,
        },
      },
    );

  if (brands_with_campaign_changes.length)
    blocks.push(
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: ':pencil2: Brands with campaign changes: ',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${brands_with_campaign_changes
            .sort((a, b) =>
              a.brand_name.toLowerCase() > b.brand_name.toLowerCase() ? 1 : -1,
            )
            .map(
              ({ brand_name, old_campaigns_length, new_campaigns_length }) =>
                `*${brand_name}*: ~${old_campaigns_length}~ ---> ${new_campaigns_length} active campaign(s)`,
            )
            .join('\n')}`,
        },
      },
    );

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<!date^${unix_time}^{date_short} {time_secs}| >`,
      },
    ],
  });

  await send_slack_notification({
    blocks,
  });
};

/* ---------- Export ---------- */
export { send_healthcheck_changes_message };
