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
interface SendTestSuccessMessageInput {
  brand: Brand;
  product: Product;
  campaign: Campaign;
  resolved_url: string;
  test_duration: number;
  test_image_url: string;
  landing_page: LandingPage;
}

/* ---------- Function ---------- */
const send_test_success_message = async ({
  brand,
  product,
  campaign,
  resolved_url,
  landing_page,
  test_duration,
  test_image_url,
}: SendTestSuccessMessageInput) => {
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
          text: ':white_check_mark: The landing page health check *succeeded!*',
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'plain_text',
            text: 'The landing page was successfully rendered and passed all tests.',
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
          text: '*Rendered landing page:*',
        },
      },
      {
        type: 'image',
        image_url: test_image_url,
        alt_text: 'Landing page preview',
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
export { send_test_success_message };
