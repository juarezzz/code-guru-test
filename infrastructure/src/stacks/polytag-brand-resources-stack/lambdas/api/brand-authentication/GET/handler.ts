/* ---------- External ---------- */
import {
  InitiateAuthCommand,
  InitiateAuthRequest,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { decode } from 'base-64';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Clients ---------- */
import { cognito_client } from '_clients/cognito';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { BACKEND_API_URL, COGNITO_CLIENT_ID } = process.env;
    const { headers } = event;

    const { Host } = headers;
    const authorization = headers.Authorization || headers.authorization;

    /* ----------
     * That's responsible for keeping the Lambda warm
     * and it returns just in case the event is from a scheduled cron.
     * ---------- */
    if (event.source && event.source === 'aws.events') {
      console.log('Keeping the lambda warm.');

      return http_response({
        body: { message: 'Getting warm.' },
        status_code: 200,
      });
    }

    /* ----------
     * Check if the request is coming from the website to
     * prevent the user from signing up from the API
     * ---------- */

    if (Host !== BACKEND_API_URL)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!authorization || !authorization.includes('Basic'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const credentials = decode(authorization.replace('Basic ', ''));

    const [username, ...password_pieces] = credentials.split(':');

    const password = password_pieces.join('');

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
      ClientId: COGNITO_CLIENT_ID,
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
    console.error('Error at GET /brand-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
