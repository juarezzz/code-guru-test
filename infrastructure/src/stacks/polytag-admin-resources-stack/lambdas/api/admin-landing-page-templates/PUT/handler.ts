/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { update_landing_page_template } from '_modules/landing-page-templates/functions/update/update-landing-page-template';
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Body {
  components: string;
  global_styles: string;
  landing_page_template_name: string;
  landing_page_template_id: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const {
      components,
      global_styles,
      landing_page_template_name,
      landing_page_template_id,
    }: Body = JSON.parse(body);

    const parsed_strings = {
      components: JSON.parse(components),
      global_styles: JSON.parse(global_styles),
    };

    const { landing_page_template } = await update_landing_page_template({
      components,
      global_styles,
      landing_page_template_name,
      landing_page_template_id,
    });

    landing_page_template.components = parsed_strings.components;
    landing_page_template.global_styles = parsed_strings.global_styles;

    return http_response({ body: { landing_page_template }, status_code: 201 });
  } catch (error) {
    console.error('Error at PUT /admin-landing-page-templates');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
