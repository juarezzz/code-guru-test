/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Schemas ---------- */
import { contact_form_schema } from '_modules/brand-contact/schemas';

/* ---------- Models ---------- */
import { ContactFormField } from '_modules/brand-contact/models';

/* ---------- Modules ---------- */
import { send_slack_message } from '_modules/brand-contact/send/send-slack-message';
import { send_email_message } from '_modules/brand-contact/send/send-email-message';

/* ---------- Interfaces ---------- */
interface Body {
  persona: string;
  receivers: string[];
  slack_channel_id: string;
  fields: ContactFormField[];
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
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

    const { persona, fields, receivers, slack_channel_id } =
      (await contact_form_schema.validate(JSON.parse(body), {
        abortEarly: true,
        stripUnknown: true,
      })) as Body;

    await Promise.allSettled([
      send_email_message({ fields, persona, receivers }),
      send_slack_message({ fields, persona, slack_channel_id }),
    ]);

    return http_response({
      body: { message: 'Message sent successfully' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /brand-contact');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
