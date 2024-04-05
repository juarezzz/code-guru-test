/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Modules ---------- */
import { create_landing_page_template } from '_modules/landing-page-templates/functions/create/create-landing-page-template';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Schemas ---------- */
import { create_landing_page_template_schema } from '_modules/landing-page-templates/schemas';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    if (!body)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    const { sub } = get_authenticated_user({ token: id_token });

    const { components, global_styles, landing_page_template_name } =
      await create_landing_page_template_schema.validate(JSON.parse(body));

    const parsed_strings = {
      components: JSON.parse(components),
      global_styles: JSON.parse(global_styles),
    };

    const { landing_page_template } = await create_landing_page_template({
      created_by: sub,
      components,
      global_styles,
      landing_page_template_name,
    });

    landing_page_template.components = parsed_strings.components;
    landing_page_template.global_styles = parsed_strings.global_styles;

    return http_response({ body: { landing_page_template }, status_code: 201 });
  } catch (error) {
    console.error('Error at POST /admin-landing-page-templates');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
