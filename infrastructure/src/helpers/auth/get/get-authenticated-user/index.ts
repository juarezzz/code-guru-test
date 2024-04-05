/* ---------- External ---------- */
import jwt_decode from 'jwt-decode';

/* ---------- Types ---------- */
import { AWS } from '__@types';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Interfaces ---------- */
interface GetAuthenticatedUserInput {
  token: string | undefined;
}

/* ---------- Function ---------- */
const get_authenticated_user = ({
  token,
}: GetAuthenticatedUserInput): AWS.Decoded => {
  if (!token) {
    throw new Error(
      handle_http_error({
        status_code: 401,
        code: error_messages['missing-access-token'].code,
        message: error_messages['missing-access-token'].message,
      }),
    );
  }

  return jwt_decode<AWS.Decoded>(token.split(' ')[1]);
};

/* ---------- Exports ---------- */
export { get_authenticated_user };
