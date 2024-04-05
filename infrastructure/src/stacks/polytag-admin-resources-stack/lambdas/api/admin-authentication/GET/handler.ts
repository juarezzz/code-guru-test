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
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers } = event;

    const authorization = headers.Authorization || headers.authorization;
    const client_id = process.env.COGNITO_CLIENT_ID;

    if (!authorization || !authorization.includes('Basic'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const credentials = decode(authorization.replace('Basic ', ''));

    const [username, ...password_parts] = credentials.split(':');

    const password = password_parts.join(':');

    if (!username || !password)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
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
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
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
    console.error('Error at GET /admin-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
