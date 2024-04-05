/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import { start_state_machine_execution } from '_helpers/utils/start-state-machine-execution';

export const handler: APIGatewayProxyHandlerV2 =
  async (): Promise<APIGatewayProxyStructuredResultV2> => {
    try {
      await start_state_machine_execution({
        input: JSON.stringify([
          {
            Payload: {
              client_last_evaluated_key: {
                initial: 'true',
              },
            },
          },
        ]),
      });

      return http_response({
        body: { message: 'State machine triggered.' },
        status_code: 202,
      });
    } catch (error) {
      console.error('Error at GET /admin-clients-status');
      console.error(error);

      return handle_http_error_response({ error });
    }
  };
