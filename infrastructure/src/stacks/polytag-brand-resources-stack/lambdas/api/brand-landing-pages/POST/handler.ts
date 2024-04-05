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
import { create_landing_page } from '_modules/landing-pages/functions/create/create-landing-page';
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';
import { get_all_landing_pages } from '_modules/landing-pages/functions/get/get-all-landing-pages';

/* ---------- Interfaces ---------- */
import { LandingPage } from '_modules/landing-pages/models';

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

interface Body {
  components: string;
  global_styles: string;
  landing_page_name: string;
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

    const { headers, body, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const {
      'cognito:groups': cognito_groups,
      'custom:brand_id': brand_id,
      sub: owner_sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-landing-pages']?.includes('POST'))
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
          status_code: 403,
        }),
      );

    const { components, landing_page_name, global_styles }: Body =
      JSON.parse(body);

    if (!components || !landing_page_name || !global_styles)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    let last_key: string | undefined;
    const all_landing_pages: LandingPage[] = [];

    do {
      const { last_evaluated_key, landing_pages: landing_pages_list } =
        await get_all_landing_pages({
          brand_id,
          last_key,
        });

      all_landing_pages.push(...landing_pages_list);

      last_key = last_evaluated_key;
    } while (last_key);

    const parts = landing_page_name.split(' ');

    const last_part = parts[parts.length - 1];

    if (!Number.isNaN(Number(last_part))) {
      parts.pop();
    }

    const formatted_name = parts.join(' ') || landing_page_name;

    const landing_page_names = all_landing_pages.map(
      page => page.landing_page_name,
    );

    const landing_page_start = landing_page_names
      .filter(name => {
        if (!name.startsWith(formatted_name)) return false;

        const name_chunks = name.split(' ');
        const words_array = name_chunks.slice(0, parts.length);

        const name_result = words_array.join(' ');

        return name_result === formatted_name;
      })
      .sort((a, b) => {
        const numeric_part_a = Number(a.replace(formatted_name, ''));
        const numeric_part_b = Number(b.replace(formatted_name, ''));
        return numeric_part_b - numeric_part_a;
      });

    let new_lp_name = '';

    if (landing_page_start.length) {
      const last_char = landing_page_start[0].split(' ').pop();

      const lp_number =
        (Number.isNaN(Number(last_char)) ? 0 : Number(last_char)) + 1;

      new_lp_name = landing_page_start.includes(landing_page_name)
        ? `${formatted_name} ${lp_number}`
        : landing_page_name;
    } else {
      new_lp_name = landing_page_name;
    }

    const { landing_page } = await create_landing_page({
      brand_id,
      components,
      global_styles,
      landing_page_name: new_lp_name,
      user_id: owner_sub,
    });

    const landing_page_return = {
      ...landing_page,
      components: JSON.parse(landing_page.components),
      global_styles: JSON.parse(landing_page.global_styles),
    };

    /* ----------
     * Set getting started steps
     * if it comes from onboarding
     * ---------- */
    if (queryStringParameters && queryStringParameters.onboarding)
      await update_user_onboarding_steps({
        brand_id,
        user_sub: owner_sub,
        action: 'add',
        steps: ['create_landing_page'],
      });

    return http_response({
      body: { landing_page: landing_page_return },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /brand-landing-pages');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
