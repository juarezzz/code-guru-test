/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_third_party } from '_modules/third-party/functions/create/create-third-party';

/* ---------- Interfaces ---------- */
interface Body {
  third_party_name?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { sub } = get_authenticated_user({ token: id_token });

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const parsed_body: Body = JSON.parse(body);
    const third_party_name = parsed_body.third_party_name;

    if (!third_party_name) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const third_party = await create_third_party({
      third_party_name,
      sub,
    });

    return http_response({ body: { third_party }, status_code: 201 });
  } catch (error) {
    console.error('Error at POST /admin-third-party');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
