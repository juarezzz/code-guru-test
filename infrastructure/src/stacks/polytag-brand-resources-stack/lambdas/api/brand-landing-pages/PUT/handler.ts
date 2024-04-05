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

/* ---------- Modules ---------- */
import { update_landing_page } from '_modules/landing-pages/functions/update/update-landing-page';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  campaigns_count: number;
  components: string;
  global_styles: string;
  landing_page_name: string;
  sort_key: string;
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

    const { headers, body } = event;

    const id_token = headers.Authorization || headers.authorization;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-landing-pages']?.includes('PUT'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
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

    const {
      campaigns_count,
      components,
      global_styles,
      landing_page_name,
      sort_key,
    }: Body = JSON.parse(body);

    if (
      [
        campaigns_count,
        components,
        global_styles,
        landing_page_name,
        sort_key,
      ].some(field => field === undefined || field === '')
    )
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { landing_page } = await update_landing_page({
      brand_id,
      campaigns_count,
      components,
      global_styles,
      landing_page_name,
      sort_key,
    });

    return http_response({
      body: {
        landing_page: {
          ...landing_page,
          components: JSON.parse(landing_page.components),
          global_styles: JSON.parse(landing_page.global_styles),
        },
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /brand-landing-pages');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
