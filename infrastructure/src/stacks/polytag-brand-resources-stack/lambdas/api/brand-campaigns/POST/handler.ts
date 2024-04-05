/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Schemas ---------- */
import { create_campaign_schema } from '_modules/campaigns/schemas';

/* ---------- Modules ---------- */
import { create_campaign } from '_modules/campaigns/functions/create/create-campaign';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';
import { get_landing_page_by_sort_key } from '_modules/landing-pages/functions/get/get-landing-page-by-sort-key';

/* ---------- Interfaces ---------- */
interface CampaignLandingPage {
  end_date: string;
  start_date: string;
  landing_page_name: string;
  landing_page_sort_key: string;
}

interface CampaignProductsGroups {
  product_group_count: number;
  product_group_name: string;
  product_group_sort_key: string;
}

interface Body {
  campaign_landing_pages: CampaignLandingPage[];
  campaign_name: string;
  campaign_product_groups: CampaignProductsGroups[];
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
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

    const { body, headers, queryStringParameters } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { campaign_landing_pages, campaign_name, campaign_product_groups } =
      (await create_campaign_schema.validate(JSON.parse(body), {
        abortEarly: true,
        stripUnknown: true,
      })) as Body;

    const id_token = headers.Authorization || headers.authorization;

    const {
      'custom:brand_id': brand_id,
      'custom:full_name': owner_name,
      'cognito:groups': cognito_groups,
      sub: owner_sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-campaigns']?.includes('POST'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 401,
        }),
      );

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 401,
        }),
      );

    const find_product_group_in_use_promises = campaign_product_groups.map(
      async campaign_product_group => {
        const product_group = await get_product_group_by_sort_key({
          brand_id,
          product_group_sort_key: campaign_product_group.product_group_sort_key,
        });

        if (!product_group)
          throw new Error(
            handle_http_error({
              code: error_messages['product-group-does-not-exist'].code,
              message: error_messages['product-group-does-not-exist'].message,
              status_code: 400,
            }),
          );

        const { assigned_campaign_sort_key } = product_group;

        if (assigned_campaign_sort_key)
          throw new Error(
            handle_http_error({
              code: error_messages['product-group-already-assigned'].code,
              message: error_messages['product-group-already-assigned'].message,
              status_code: 400,
            }),
          );
      },
    );

    await Promise.all(find_product_group_in_use_promises);

    const campaign_landing_pages_keys = new Set(
      campaign_landing_pages.map(
        ({ landing_page_sort_key }) => landing_page_sort_key,
      ),
    );

    const get_landing_pages_promises = Array.from(
      campaign_landing_pages_keys,
    ).map(landing_page_sort_key => {
      return get_landing_page_by_sort_key({
        brand_id,
        landing_page_sort_key,
      });
    });

    const get_landing_pages_result = await Promise.all(
      get_landing_pages_promises,
    );

    const has_invalid_landing_page = get_landing_pages_result.some(
      ({ landing_page }) => !landing_page,
    );

    if (has_invalid_landing_page) {
      throw new Error(
        handle_http_error({
          code: error_messages['landing-page-does-not-exist'].code,
          message: error_messages['landing-page-does-not-exist'].message,
          status_code: 400,
        }),
      );
    }

    const campaign = await create_campaign({
      campaign_landing_pages,
      campaign_name,
      campaign_product_groups,
      brand_id,
      owner_name,
    });

    /* ----------
     * Set getting started steps
     * if it comes from onboarding
     * ---------- */

    if (queryStringParameters && queryStringParameters.onboarding)
      await update_user_onboarding_steps({
        brand_id,
        user_sub: owner_sub,
        action: 'add',
        steps: ['create_campaign'],
      });

    return http_response({ body: { campaign }, status_code: 200 });
  } catch (error) {
    console.error('Error at POST /brand-campaigns');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
