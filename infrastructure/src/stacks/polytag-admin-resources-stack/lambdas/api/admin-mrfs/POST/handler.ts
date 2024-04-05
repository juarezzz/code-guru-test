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

/* ---------- Modules ---------- */
import { create_mrf } from '_modules/mrfs/functions/create/create-mrf';

/* ---------- Schemas ---------- */
import { create_mrf_schema } from '_modules/mrfs/schemas';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

interface Body {
  mrf_name: string;
  latitude: number;
  longitude: number;
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

    const mrf_input = await create_mrf_schema.validate(JSON.parse(body), {
      stripUnknown: true,
    });

    const mrf = await create_mrf({
      ...mrf_input,
      sub,
    });

    return http_response({ body: { mrf }, status_code: 200 });
  } catch (error) {
    console.error('Error at POST /admin-mrfs');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
