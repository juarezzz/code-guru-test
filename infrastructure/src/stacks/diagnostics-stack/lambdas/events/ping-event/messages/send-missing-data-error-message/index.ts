/* ---------- External ---------- */
import { format, getUnixTime } from 'date-fns';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';
import { Product } from '_modules/products/models';
import { Campaign } from '_modules/campaigns/models';
import { LandingPage } from '_modules/landing-pages/models';

/* ---------- Helpers ---------- */
import { send_slack_notification } from '_helpers/slack/send-slack-notification';

/* ---------- Interfaces ---------- */
interface SendMissingDataErrorMessageInput {
  brand?: Brand;
  product?: Product;
  campaign?: Campaign;
  resolved_url: string;
  landing_page?: LandingPage;
}

/* ---------- Function ---------- */
const send_missing_data_error_message = async ({
  brand,
  product,
  campaign,
  resolved_url,
  landing_page,
}: SendMissingDataErrorMessageInput) => {
  const unix_time = getUnixTime(new Date());
  const test_date = format(new Date(), 'dd/MM/yyyy');

  const status_message = `Resolved URL: ${resolved_url}\nProduct: ${
    product?.product_name || ':x: Not found'
  }\nCampaign: ${campaign?.campaign_name || ':x: Not found'}\nBrand: ${
    brand?.brand_name || ':x: Not found'
  }\nLanding Page: ${landing_page?.landing_page_name || ':x: Not found'}`;

  await send_slack_notification({
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `Landing Pages Health Check Results - ${test_date}`,
          emoji: true,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':x: *Missing* landing page data',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: 'Failed to fetch information about the selected landing page.',
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: status_message,
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
export { send_missing_data_error_message };
