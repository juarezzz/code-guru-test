/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { get_mrf_by_id } from '_modules/mrfs/functions/get/get-mrf-by-id';
import { update_mrf } from '_modules/mrfs/functions/update/update-mrf';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { error_messages } from '_constants/error-messages';
import { update_mrf_schema } from '_modules/mrfs/schemas';

/* ---------- Interfaces ---------- */
interface Body {
  mrf_id: string;
  latitude: number;
  longitude: number;
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

    const { mrf_id, latitude, longitude } = await update_mrf_schema.validate(
      JSON.parse(body),
    );

    const { mrf } = await get_mrf_by_id({ mrf_id });

    if (!mrf)
      throw new Error(
        handle_http_error({
          code: error_messages['mrf-does-not-exist'].code,
          message: error_messages['mrf-does-not-exist'].message,
          status_code: 404,
        }),
      );

    const { mrf_name, created_at, created_by, location, updated_at } =
      await update_mrf({
        latitude,
        longitude,
        mrf_id,
      });

    return http_response({
      body: { mrf: { mrf_name, created_at, created_by, location, updated_at } },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at PUT /admin-mrfs');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
