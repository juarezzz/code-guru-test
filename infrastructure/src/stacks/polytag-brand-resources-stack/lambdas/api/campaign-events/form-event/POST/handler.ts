/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { error_messages } from '_constants/error-messages';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Schemas ---------- */

/* ---------- Modules ---------- */
import { create_serial_form_event } from '_modules/campaign-events/functions/create/create-serial-form-event';
import { create_email_form_event } from '_modules/campaign-events/functions/create/create-email-form-event';

/* ---------- Constants ---------- */
import { http_response } from '_helpers/responses/http-response';
import { get_product_by_gtin } from '_modules/products/functions/get/get-product-by-gtin';
import { get_third_party_label } from '_modules/third-party/functions/get/get-third-party-label';
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  brand_id: string;
  email: string;
  campaign_id: string;
  landing_page_id: string;
  gtin?: string;
  serial?: string;
  checkboxes: Array<{
    label: string;
    checked: boolean;
    mandatory: boolean;
  }>;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const {
      serial,
      gtin,
      email,
      campaign_id,
      brand_id,
      landing_page_id,
      checkboxes,
    } = JSON.parse(body) as Body;

    if (!brand_id || !email || !campaign_id || !gtin || !landing_page_id)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { product } = await get_product_by_gtin({ gtin });

    if (!product)
      throw new Error(
        handle_http_error({
          message: error_messages['product-does-not-exist'].message,
          status_code: 404,
          code: error_messages['product-does-not-exist'].code,
        }),
      );

    if (!product.product_group_sort_key)
      throw new Error(
        handle_http_error({
          message: error_messages['product-group-does-not-exist'].message,
          status_code: 404,
          code: error_messages['product-group-does-not-exist'].code,
        }),
      );

    const campaign = await get_campaign_by_sort_key({
      brand_id,
      campaign_sort_key: `brand-campaign#${campaign_id}`,
    });

    if (!campaign)
      throw new Error(
        handle_http_error({
          message: error_messages['campaign-does-not-exist'].message,
          status_code: 404,
          code: error_messages['campaign-does-not-exist'].code,
        }),
      );

    if (
      !campaign.campaign_product_groups
        .map(pg => pg.product_group_sort_key)
        .includes(product.product_group_sort_key)
    )
      throw new Error(
        handle_http_error({
          message:
            error_messages['product-does-not-belong-to-campaign'].message,
          status_code: 400,
          code: error_messages['product-does-not-belong-to-campaign'].code,
        }),
      );

    const landing_page = campaign.campaign_landing_pages.find(
      lp =>
        lp.landing_page_sort_key === `brand-landing-page#${landing_page_id}`,
    );

    if (!landing_page)
      throw new Error(
        handle_http_error({
          message: error_messages['landing-page-does-not-exist'].message,
          status_code: 404,
          code: error_messages['landing-page-does-not-exist'].code,
        }),
      );

    if (serial) {
      const { third_party_label } = await get_third_party_label({
        gtin,
        serial,
      });

      if (!third_party_label)
        throw new Error(
          handle_http_error({
            message: error_messages['serial-does-not-exist'].message,
            status_code: 404,
            code: error_messages['serial-does-not-exist'].code,
          }),
        );
    }

    let form_event;

    try {
      if (serial)
        form_event = await create_serial_form_event({
          email,
          campaign_id,
          campaign_name: campaign.campaign_name,
          landing_page_name: landing_page.landing_page_name,
          product_name: product.product_name,
          serial,
          gtin,
          brand_id,
          checkboxes,
        });
      else
        form_event = await create_email_form_event({
          email,
          campaign_id,
          campaign_name: campaign.campaign_name,
          landing_page_name: landing_page.landing_page_name,
          product_name: product.product_name,
          gtin,
          brand_id,
          checkboxes,
        });
    } catch (e) {
      if ((e as Error).name === 'ConditionalCheckFailedException') {
        const key = serial
          ? 'serial-already-in-campaign-event'
          : 'email-already-in-campaign-event';

        throw new Error(
          handle_http_error({
            code: error_messages[key].code,
            message: error_messages[key].message,
            status_code: 400,
          }),
        );
      }
      throw e;
    }

    return http_response({
      body: { created_event: form_event },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /campaign-events/form-event');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
