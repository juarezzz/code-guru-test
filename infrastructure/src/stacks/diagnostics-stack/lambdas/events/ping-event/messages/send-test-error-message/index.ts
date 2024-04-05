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
interface SendTestErrorMessageInput {
  brand: Brand;
  product: Product;
  campaign: Campaign;
  resolved_url: string;
  test_duration: number;
  landing_page: LandingPage;
  test_error_message: string;
}

/* ---------- Function ---------- */
const send_test_error_message = async ({
  brand,
  product,
  campaign,
  resolved_url,
  landing_page,
  test_duration,
  test_error_message,
}: SendTestErrorMessageInput) => {
  const unix_time = getUnixTime(new Date());
  const test_date = format(new Date(), 'dd/MM/yyyy');

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
          text: '❌ The landing page health check *failed!*',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: "The resolved landing page content didn't conform with what was expected.",
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Product: ${product.product_name}\nCampaign: ${campaign.campaign_name}\nBrand: ${brand.brand_name}\nLanding Page: ${landing_page.landing_page_name}\nResolved URL: ${resolved_url}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Error message:*',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: test_error_message,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            style: 'primary',
            text: {
              type: 'plain_text',
              text: 'Open Landing Page',
              emoji: true,
            },
            url: resolved_url,
            value: 'view-lp',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<!date^${unix_time}^{date_short} {time_secs}| >`,
          },
          {
            type: 'mrkdwn',
            text: `Test duration: ${test_duration.toFixed(3)}ms`,
          },
        ],
      },
    ],
  });
};

/* ---------- Export ---------- */
export { send_test_error_message };
