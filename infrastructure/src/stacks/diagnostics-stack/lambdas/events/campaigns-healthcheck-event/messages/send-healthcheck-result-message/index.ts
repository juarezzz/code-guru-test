/* ---------- External ---------- */
import { getUnixTime } from 'date-fns';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
interface SendTestSuccessMessageInput {
  brands_with_active_campaigns: {
    brand_name: string;
    campaigns: Campaign[];
  }[];
  brands_with_expiring_campaigns: {
    brand_name: string;
    num_of_campaigns_expiring: number;
  }[];
}

/* ---------- Function ---------- */
const send_healthcheck_result_message = async ({
  brands_with_active_campaigns,
  brands_with_expiring_campaigns,
}: SendTestSuccessMessageInput) => {
  const unix_time = getUnixTime(new Date());
  const test_date = new Date()
    .toLocaleString('en-GB', {
      timeZone: 'Europe/London',
    })
    .toUpperCase();

  await send_slack_notification({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Campaigns Health Check Results - ${test_date}`,
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Brand accounts with active campaigns: ',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${brands_with_active_campaigns
            .sort((a, b) =>
              a.brand_name.toLowerCase() > b.brand_name.toLowerCase() ? 1 : -1,
            )
            .map(({ brand_name, campaigns }) => {
              const expiring_campaigns = brands_with_expiring_campaigns.find(
                brand => brand_name === brand.brand_name,
              );
              return `*${brand_name}*: ${campaigns.length} active campaign(s) ${
                expiring_campaigns
                  ? `| *${expiring_campaigns.num_of_campaigns_expiring} campaign(s) ending soon* :exclamation:`
                  : ''
              }`;
            })
            .join('\n')}`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${unix_time}^{date_short} {time_secs}| >`,
          },
        ],
      },
    ],
  });
};

/* ---------- Export ---------- */
export { send_healthcheck_result_message };
