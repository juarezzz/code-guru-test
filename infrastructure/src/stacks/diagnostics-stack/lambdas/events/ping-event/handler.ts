/* ---------- External ---------- */
import { random } from 'lodash';
import { addMinutes } from 'date-fns';
import { ParseToken, Parser } from 'html-tokenizer';
import { performance } from 'perf_hooks';
import chrome_lambda from 'chrome-aws-lambda';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Context, Callback, ScheduledEvent } from 'aws-lambda';
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import {
  Page,
  Locator,
  chromium,
  expect,
  Browser,
  BrowserContext,
} from '@playwright/test';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Helpers ---------- */
import { create_error_message } from '_helpers/general/create-error-message';

/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';
import { LandingPage } from '_modules/landing-pages/models';
import { Product } from '_modules/products/models';

/* ---------- Modules ---------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { get_product_by_gtin } from '_modules/products/functions/get/get-product-by-gtin';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';

/* ---------- Send Messages ---------- */
import { send_test_error_message } from '_stacks/diagnostics-stack/lambdas/events/ping-event/messages/send-test-error-message';
import { send_test_success_message } from '_stacks/diagnostics-stack/lambdas/events/ping-event/messages/send-test-success-message';
import { send_no_pages_error_message } from '_stacks/diagnostics-stack/lambdas/events/ping-event/messages/send-no-pages-error-message';
import { send_internal_error_message } from '_stacks/diagnostics-stack/lambdas/events/ping-event/messages/send-internal-error-message';
import { send_missing_data_error_message } from '_stacks/diagnostics-stack/lambdas/events/ping-event/messages/send-missing-data-error-message';

/* ---------- Interfaces ---------- */
type ComponentType =
  | 'heading'
  | 'button'
  | 'section'
  | 'html'
  | 'image'
  | 'paragraph'
  | 'video';

interface LandingPageComponent {
  id: string;
  title: string;
  text?: string;
  link?: string;
  content?: string;
  link_url?: string;
  alt_text?: string;
  provider?: string;
  video_id?: string;
  image_url?: string;
  image_link?: string;
  is_form?: boolean;
  type: ComponentType;
  children?: LandingPageComponent[];
}

interface TestLandingPageInput {
  locator: Locator;
  components: LandingPageComponent[];
}

/* -------------- Constants -------------- */
const VIDEO_PROVIDERS: Record<
  string,
  { prefix: string; suffix: string } | undefined
> = {
  vimeo: { prefix: 'https://player.vimeo.com/video/', suffix: '' },
  youtube: {
    prefix: 'https://www.youtube-nocookie.com/embed/',
    suffix: '?origin=',
  },
} as const;

/* -------------- Functions -------------- */
const remove_br_tags = (tokens: ParseToken[]) =>
  tokens.filter(token => (token as unknown as { name: string }).name !== 'br');

const inject_product_vars = (text: string, product?: Product): LandingPage => {
  const product_name = product?.product_name || '(product name)';
  const group_name = product?.product_group_name || '(product group)';
  const image_url = product?.image_url || '';
  const information_url = product?.information_url || '';
  const components = product?.components || [];
  const attributes = product?.attributes || [];

  let new_text = text
    .replace(/\[PRODUCT_NAME\]/g, product_name)
    .replace(/\[PRODUCT_GRP\]/g, group_name)
    .replace(/\[PRODUCT_IMG\]/g, image_url)
    .replace(/\[MORE_INFO\]/g, information_url);

  components.forEach(({ name, material, percentage, weight }, index) => {
    const name_regex = new RegExp(`\\[COMP${index + 1}_NAME\\]`, 'g');
    const material_regex = new RegExp(`\\[COMP${index + 1}_MATERIAL\\]`, 'g');
    const percentage_regex = new RegExp(`\\[COMP${index + 1}_R%\\]`, 'g');
    const weight_regex = new RegExp(`\\[COMP${index + 1}_WEIGHT\\]`, 'g');

    new_text = new_text.replace(name_regex, name);

    new_text = new_text.replace(material_regex, material);

    new_text = new_text.replace(percentage_regex, String(percentage));

    new_text = new_text.replace(weight_regex, String(weight));
  });

  attributes.forEach(({ name, value }) => {
    const value_regex = new RegExp(
      `\\[${name.split(' ').join('_').toLocaleUpperCase()}\\]`,
      'g',
    );

    new_text = new_text.replace(value_regex, value || '(product attribute)');
  });

  return JSON.parse(new_text);
};

const fetch_random_active_page = async () => {
  const start_date = new Date().getTime();
  const end_date = addMinutes(new Date(), 5).getTime();

  const query_params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-index',
    KeyConditionExpression: 'datatype = :datatype',
    FilterExpression: 'starts_on <= :start_date AND runs_until >= :end_date',
    ExpressionAttributeValues: {
      ':datatype': 'brand-display-page',
      ':start_date': start_date,
      ':end_date': end_date,
    },
  };

  const query_command = new QueryCommand(query_params);
  const { Items } = await dynamodb_documentclient.send(query_command);

  if (!Items?.length) return undefined;

  const brand_displays = Items as DisplayPage[];

  const random_index = random(0, brand_displays.length - 1, false);

  const random_display = brand_displays[random_index];

  return random_display;
};

const start_browser_instance = async () => {
  let tries = 0;

  while (tries < 5) {
    try {
      const browser = await chromium.launch({
        headless: true,
        executablePath: await chrome_lambda.executablePath,
        args: ['--single-process'],
      });

      const context = await browser.newContext({
        viewport: { height: 812, width: 375 },
        isMobile: true,
        screen: { height: 812, width: 375 },
        hasTouch: true,
        userAgent:
          'Mozilla/5.0 (Linux; Android 7.0; SM-G930V Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36',
      });

      return [browser, context] as const;
    } catch (e) {
      tries += 1;
      console.log(`Error launching browser at ${tries} try`);
      console.error(e);
    }
  }

  return [undefined, undefined];
};

const test_landing_page = async ({
  locator,
  components,
}: TestLandingPageInput) => {
  /* ----------
   * Comparing rendered elements to
   * what's expected in the landing page
   * ---------- */

  for (const component of components) {
    switch (component.type) {
      case 'button': {
        const tag = component.link_url ? 'a' : 'button';

        const element = locator.locator(
          `//${tag}[@data-testid="${component.id}"]`,
        );

        await expect(element).toHaveText(component?.text || '');

        if (tag === 'a') {
          await expect(element).toHaveAttribute(
            'href',
            component.link_url || '',
          );
        }

        break;
      }

      case 'heading': {
        const element = locator.locator(`//h3[@data-testid="${component.id}"]`);

        await expect(element).toHaveText(component?.text || '');

        break;
      }

      case 'html': {
        const element = locator.locator(
          `//div[@data-testid="${component.id}"]`,
        );

        const inner = await element.innerHTML();

        const tokenized_expected_content = [
          ...Parser.parse(component.content?.toLowerCase() || ''),
        ];

        const tokenized_resolved_content = [
          ...Parser.parse(inner.toLowerCase() || ''),
        ];

        expect(remove_br_tags(tokenized_expected_content)).toStrictEqual(
          remove_br_tags(tokenized_resolved_content),
        );

        break;
      }

      case 'image': {
        const element = locator.locator(
          `//img[@data-testid="${component.id}"]`,
        );

        await expect(element).toHaveAttribute('src', component.image_url || '');

        await expect(element).toHaveAttribute(
          'alt',
          component.alt_text || component.title,
        );

        break;
      }

      case 'paragraph': {
        const element = locator.locator(`//p[@data-testid="${component.id}"]`);

        await expect(element).toHaveText(component?.text || '');

        break;
      }

      case 'video': {
        const element = locator.locator(
          `//iframe[@data-testid="${component.id}"]`,
        );

        const provider_data = VIDEO_PROVIDERS[component.provider || ''];

        const expected_src = provider_data
          ? `${provider_data.prefix}${component.video_id}${provider_data.suffix}`
          : '';

        await expect(element).toHaveAttribute('src', expected_src);

        break;
      }

      case 'section': {
        const tag = component.is_form ? 'form' : 'div';

        const element = locator.locator(
          `//${tag}[@data-testid="${component.id}"]`,
        );

        await test_landing_page({
          locator: element,
          components: component.children || [],
        });

        break;
      }

      default:
        // Do nothing

        break;
    }
  }
};

export const handler = async (
  event: ScheduledEvent,
  _: Context,
  callback: Callback,
): Promise<void> => {
  /* ----------
   * Global Playwright variables
   * ---------- */
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;
  let page: Page | undefined;

  try {
    console.log('Fetching random display page...');

    /* ----------
     * Fetching a random active page
     * ---------- */
    const live_display_page = await fetch_random_active_page();

    console.log('Chosen display page: ', JSON.stringify(live_display_page));

    /* ----------
     * If no active pages found,
     * notify the slack channel
     * ---------- */
    if (!live_display_page) {
      await send_no_pages_error_message();

      return callback(null, event);
    }

    /* ----------
     * Retrieving the campaign and landing page info
     * ---------- */
    const resolved_url = `${process.env?.RESOLVER_URL}${live_display_page.product_id}`;

    const brand_id = live_display_page.partition_key.split('#')[1];
    const campaign_sort_key = `brand-campaign#${live_display_page.campaign_id}`;
    const landing_page_sort_key = `brand-landing-page#${live_display_page.landing_page_id}`;

    console.log('Fetching campaign information...');

    const [campaign, { landing_page }, { product }, { brand }] =
      await Promise.all([
        get_campaign_by_sort_key({
          brand_id,
          campaign_sort_key,
        }),

        get_landing_page_by_sort_key({
          brand_id,
          landing_page_sort_key,
        }),

        get_product_by_gtin({ gtin: live_display_page.product_id }),

        get_brand({ brand_id }),
      ]);

    /* ----------
     * Aborting tests and sending Slack
     * message indicating there's missing data
     * ---------- */
    if (!campaign || !landing_page || !product || !brand) {
      await send_missing_data_error_message({
        product,
        campaign,
        resolved_url,
        landing_page,
        brand: brand || undefined,
      });

      return callback(null, event);
    }

    console.log('Starting chromium instance...');

    /* ----------
     * Spinning up a mini chromium instance for testing
     * the page again the retrieved landing page
     * ---------- */

    [browser, context] = await start_browser_instance();

    if (!browser || !context) {
      await send_internal_error_message({
        internal_error_message: 'Failed to start browser instance',
      });

      return callback(null, event);
    }

    console.log('Going to resolved display page url: ', resolved_url);

    page = await context.newPage();

    await page.goto(resolved_url);

    const page_body = page.getByTestId('landing-page-renderer');

    /* ----------
     * Sending a Slack message depending
     * with the test results and duration
     * ---------- */
    const test_start_time = performance.now();

    let error_message: string | undefined;

    const updated_landing_page = inject_product_vars(
      JSON.stringify(landing_page),
      product,
    );

    console.log('Starting test...');

    try {
      await test_landing_page({
        locator: page_body,
        components: JSON.parse(
          updated_landing_page.components,
        ) as LandingPageComponent[],
      });
    } catch (error) {
      error_message = JSON.stringify(error);
    }

    const test_end_time = performance.now();

    const test_duration = test_end_time - test_start_time;

    if (error_message) {
      console.log(error_message);

      const test_error_message = create_error_message(error_message);

      await send_test_error_message({
        brand,
        product,
        campaign,
        resolved_url,
        landing_page,
        test_duration,
        test_error_message,
      });

      /* ----------
       * Error cleanup
       * ---------- */
      await page.close();
      await context.close();
      await browser.close();

      return callback(null, event);
    }

    /* ----------
     * If the tests succeeded, take a screenshot and
     * upload it to a S3 bucket to be sent to Slack
     * ---------- */
    const test_screenshot = await page.screenshot({
      fullPage: true,
      type: 'png',
      path: '/tmp/test-screenshot.png',
      timeout: 15_000,
    });

    const screenshot_key = `test-screenshots/test-${new Date().toISOString()}.png`;

    console.log('Uploading screenshot image...');

    const upload_screenshot_command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Body: test_screenshot,
      Key: screenshot_key,
    });

    await s3_client.send(upload_screenshot_command);

    const test_image_url = `${process.env.BUCKET_URL}/${screenshot_key}`;

    await send_test_success_message({
      brand,
      product,
      campaign,
      resolved_url,
      landing_page,
      test_duration,
      test_image_url,
    });

    /* ----------
     * Cleanup
     * ---------- */
    await page.close();
    await context.close();
    await browser.close();
  } catch (error) {
    console.error(error);

    /* ----------
     * Sending error message to Slack
     * ---------- */
    await send_internal_error_message({
      internal_error_message: create_error_message(JSON.stringify(error)),
    });

    /* ----------
     * Panic Cleanup
     * ---------- */
    await page?.close();
    await context?.close();
    await browser?.close();
  }

  return callback(null, event);
};
