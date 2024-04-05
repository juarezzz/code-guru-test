/* -------------- Types -------------- */
import {
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

/* ---------- Modules ---------- */
import { get_all_landing_page_templates } from '_modules/landing-page-templates/functions/get/get-all-landing-page-templates';
import { get_landing_page_template_by_id } from '_modules/landing-page-templates/functions/get/get-landing-page-template-by-id';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, queryStringParameters } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, 'cognito:groups': groups } =
      get_authenticated_user({
        token: id_token,
      });

    // Allow admins and users with associated with a brand
    if (!brand_id) {
      const is_admin =
        groups.includes('polytag-admin') ||
        groups.includes('polytag-super-admin');

      if (!is_admin)
        throw new Error(
          handle_http_error({
            code: error_messages.unauthorized.code,
            message: error_messages.unauthorized.message,
            status_code: 403,
          }),
        );
    }

    /* ----------
     * GET endpoint
     * ---------- */
    const landing_page_template_id =
      queryStringParameters?.landing_page_template_id;

    if (landing_page_template_id) {
      const { landing_page_template } = await get_landing_page_template_by_id({
        landing_page_template_id,
      });

      return http_response({
        body: { landing_page_template },
        status_code: 200,
      });
    }

    /* ----------
     * LIST endpoint
     * ---------- */
    const last_key = queryStringParameters?.last_key;

    const { landing_page_templates, last_evaluated_key } =
      await get_all_landing_page_templates({
        last_key,
      });

    return http_response({
      body: { landing_page_templates, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /landing-page-templates');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
