/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Functions ---------- */
import { get_all_mrfs } from '_modules/mrfs/functions/get/get-all-mrfs';

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters } = event;

    const last_key = queryStringParameters?.last_key;

    const { mrfs, last_evaluated_key } = await get_all_mrfs({
      last_key,
    });

    return http_response({
      body: { mrfs, last_evaluated_key },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /mrfs');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
