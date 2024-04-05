/* ---------- External ---------- */
import * as Yup from 'yup';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_product_by_gtin } from '_modules/products/functions/get/get-product-by-gtin';
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';
import { get_active_display_page_by_gtin } from '_modules/display-page/functions/get/get-active-display-page-by-gtin';

/* ----------- Schemas ----------- */
export const decompress_schema = Yup.object({
  gtin: Yup.string().required().min(2).max(55),
});

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  /* ---------- Controller ---------- */
  try {
    /* ----------
     * That's responsible for keeping the Lambda warm
     * and it returns just in case the event is from a scheduled cron.
     * ---------- */
    if (event.source && event.source === 'aws.events') {
      console.log('Keeping the lambda warm.');

      return http_response({
        body: { message: 'Getting warm.' },
        status_code: 200,
      });
    }

    const { queryStringParameters } = event;

    if (!queryStringParameters || !queryStringParameters.gtin)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { gtin } = queryStringParameters;

    await decompress_schema.validate({
      gtin,
    });

    const [{ display_page }, { product }] = await Promise.all([
      get_active_display_page_by_gtin({ gtin }),
      get_product_by_gtin({ gtin }),
    ]);

    const { landing_page } = display_page
      ? await get_landing_page_by_sort_key({
          brand_id: display_page.partition_key.replace('brand#', ''),
          landing_page_sort_key: `brand-landing-page#${display_page.landing_page_id}`,
        })
      : { landing_page: undefined };

    if (!display_page || !landing_page || !product) {
      return http_response({
        body: {
          landing_page: {},
          metadata: {
            product,
          },

          // TODO: Put the logo back
          // logo_url: organisation && organisation.logo_url,
        },
        status_code: 200,
      });
    }

    const response = {
      landing_page: {
        ...landing_page,
        components: JSON.parse(landing_page.components),
        global_styles: JSON.parse(landing_page.global_styles),
      },
      metadata: {
        landing_page_id: display_page.landing_page_id,
        campaign_id: display_page.campaign_id,
        product_group_id: display_page.product_group_id,
        product,
      },
    };

    return http_response({
      body: response,
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /brand-display-page');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
