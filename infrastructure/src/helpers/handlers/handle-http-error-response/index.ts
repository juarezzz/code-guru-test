/* ---------- External ---------- */
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';

/* ---------- Interfaces ---------- */
interface HandleHttpErrorResponse {
  error: unknown;
}
interface ParsedError {
  code?: string;
  message: string;
  status_code: number;
}

const handle_http_error_response = ({
  error,
}: HandleHttpErrorResponse): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof Error) {
    try {
      const parsed_error = JSON.parse(error.message) as ParsedError;

      if (parsed_error.status_code < 500)
        return http_response({
          status_code: parsed_error.status_code,
          body: { message: parsed_error.message, code: parsed_error.code },
        });
    } catch {
      return http_response({
        status_code: 500,
        body: { message: error.message },
      });
    }
  }

  throw error;
};

export { handle_http_error_response };
