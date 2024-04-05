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
import { update_campaign_schema } from '_modules/campaigns/schemas';

/* ---------- Modules ---------- */
import { get_campaign_by_sort_key } from '_modules/campaigns/functions/get/get-campaign-by-sort-key';
import { get_product_group_by_sort_key } from '_modules/product-groups/functions/get/get-product-group-by-sort-key';
import { update_campaign } from '_modules/campaigns/functions/update/update-campaign';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface CampaignLandingPage {
  end_date: string;
  start_date: string;
  landing_page_name: string;
  landing_page_sort_key: string;
}

interface CampaignProductGroup {
  product_group_count: number;
  product_group_name: string;
  product_group_sort_key: string;
}

interface Body {
  campaign_landing_pages: CampaignLandingPage[];
  campaign_name: string;
  campaign_product_groups: CampaignProductGroup[];
  campaign_sort_key: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
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
      update_campaign_schema.validateSync(JSON.parse(body), {
        abortEarly: true,
        stripUnknown: true,
      }) as Body;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-campaigns']?.includes('PUT'))
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

    if (!queryStringParameters || !queryStringParameters.campaign_sort_key)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    /* ----------
     * Starts here
     * ---------- */
    const { campaign_sort_key } = queryStringParameters;

    const campaign = await get_campaign_by_sort_key({
      campaign_sort_key,
      brand_id,
    });

    if (!campaign)
      throw new Error(
        handle_http_error({
          code: error_messages['campaign-does-not-exist'].code,
          message: error_messages['campaign-does-not-exist'].message,
          status_code: 400,
        }),
      );

    const pg_promises = campaign_product_groups.map(
      async campaign_product_group => {
        const found = campaign.campaign_product_groups.find(
          c =>
            c.product_group_sort_key ===
            campaign_product_group.product_group_sort_key,
        );

        if (found) return;

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

    await Promise.all(pg_promises);

    const { campaign: updated_campaign } = await update_campaign({
      campaign_sort_key: campaign.sort_key,
      brand_id,
      campaign_landing_pages,
      campaign_name,
      campaign_product_groups,
    });

    return http_response({
      body: { campaign: updated_campaign },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /brand-campaigns');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
