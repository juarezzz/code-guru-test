/* eslint-disable @typescript-eslint/no-explicit-any */
/* ---------- Types ---------- */
import { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

/* ---------- Interfaces ---------- */
interface HttpResponseInput {
  status_code: number;
  body: { [key: string]: any };
}

/* ---------- Function ---------- */
export const http_response = ({
  body,
  status_code,
}: HttpResponseInput): APIGatewayProxyStructuredResultV2 =>
  ({
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin':
        process.env.ENVIRONMENT === 'PROD' && process.env.CORS_ALLOWED_ORIGIN
          ? `https://${process.env.CORS_ALLOWED_ORIGIN}`
          : '*',
    },
    statusCode: status_code,
  } as APIGatewayProxyStructuredResultV2);
