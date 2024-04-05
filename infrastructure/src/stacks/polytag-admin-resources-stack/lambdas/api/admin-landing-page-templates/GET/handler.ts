/* -------------- Types -------------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { get_all_landing_page_templates } from '_modules/landing-page-templates/functions/get/get-all-landing-page-templates';
import { get_landing_page_template_by_id } from '_modules/landing-page-templates/functions/get/get-landing-page-template-by-id';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    /* ----------
     * GET endpoint
     * ---------- */
    if (queryStringParameters?.landing_page_template_id) {
      const { landing_page_template_id } = queryStringParameters;

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
    console.error('Error at GET /admin-landing-page-templates');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
