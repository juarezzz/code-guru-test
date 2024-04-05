import { Request } from 'express';

interface ConvertExpressToLambdaDTO {
  request: Request;
}

export const convertExpressToLambda = ({
  request,
}: ConvertExpressToLambdaDTO) => ({
  body: JSON.stringify(request.body),
  path: request.path,
  httpMethod: request.method,
  queryStringParameters: request.query,
  headers: request.headers,
});
