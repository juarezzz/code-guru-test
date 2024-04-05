/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import { decode } from 'base-64';
import {
  InitiateAuthCommand,
  InitiateAuthRequest,
} from '@aws-sdk/client-cognito-identity-provider';

/* ---------- Helpers ---------- */
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

export const handler: APIGatewayProxyHandlerV2 = async (
  ev,
): Promise<APIGatewayProxyStructuredResultV2> =>
  log_lambda_metrics(ev, async event => {
    try {
      const { headers } = event;

      const authorization = headers.Authorization || headers.authorization;
      const client_id = process.env.COGNITO_CLIENT_ID;

      if (!authorization)
        throw new Error(
          httpError({
            status_code: 400,
            message: 'Request missing authorization header.',
          }),
        );

      if (!authorization.includes('Basic'))
        throw new Error(
          httpError({
            status_code: 400,
            message: 'The token provided is not a Basic token.',
          }),
        );

      const credentials = decode(authorization.replace('Basic ', ''));

      const [username, ...password_parts] = credentials.split(':');

      const password = password_parts.join(':');

      if (!username || !password)
        throw new Error(
          httpError({
            status_code: 400,
            message: 'Token is missing username or password.',
          }),
        );

      /* ----------
       * Initiate a call to cognito to
       * sign up the user
       * ---------- */
      const params: InitiateAuthRequest = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: client_id,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      };

      const command = new InitiateAuthCommand(params);

      const { AuthenticationResult } = await cognito_client.send(command);

      /* ----------
       * Check if the user was successfully signed up
       * and return the user's jwt token
       * ---------- */
      if (!AuthenticationResult)
        throw new Error(
          httpError({ status_code: 401, message: 'Invalid credentials.' }),
        );

      const {
        AccessToken: access_token,
        RefreshToken: refresh_token,
        IdToken: id_token,
      } = AuthenticationResult;

      return http_response({
        body: { access_token, id_token, refresh_token },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at GET /third-party-authentication');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
