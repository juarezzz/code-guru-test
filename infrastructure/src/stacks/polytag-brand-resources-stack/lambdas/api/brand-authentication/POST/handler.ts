/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { validate_email_domain } from '_helpers/utils/validate-email-domain';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { create_brand_user } from '_modules/users/functions/create/create-brand-user';
import { get_brand_invitation } from '_modules/brands/functions/get/get-brand-invitation';
import { create_cognito_brand_user } from '_modules/users/functions/create/create-cognito-brand-user';
import { delete_polytag_brand_invite } from '_modules/users/functions/delete/delete-polytag-brand-invite';
import { get_polytag_brand_user_invite } from '_modules/users/functions/get/get-polytag-brand-user-invite';

/* ---------- Types ---------- */
import { BrandUserRole } from '_modules/users/models/user';

/* ---------- Interfaces ---------- */
interface Body {
  email: string;
  password: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body } = event;

    if (!body) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    const { email, password }: Body = JSON.parse(body);

    if (!email || !password) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    const user_invitation = await get_brand_invitation(email);

    if (user_invitation?.partition_key.includes('brand#')) {
      const brand_id = user_invitation.partition_key.split('#')[1];

      const { cognito_user } = await create_cognito_brand_user({
        email,
        password,
        brand_id,
        roles: user_invitation.roles,
      });

      await Promise.all([
        create_brand_user({
          email,
          brand_id,
          sub: cognito_user.UserSub || '',
          role: user_invitation.roles[0] as BrandUserRole,
        }),

        delete_polytag_brand_invite({ email }),
      ]);

      return http_response({
        body: { message: 'Account created successfully.' },
        status_code: 200,
      });
    }

    const { brand_user_invite } = await get_polytag_brand_user_invite({
      email,
    });

    const is_blacklisted = validate_email_domain(email.split('@')[1]);

    if (!brand_user_invite && is_blacklisted) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['unauthorized-email-address'].code,
          message: error_messages['unauthorized-email-address'].message,
        }),
      );
    }

    await Promise.all([
      create_cognito_brand_user({
        email,
        password,
        brand_id: '',
        roles: ['brand-admin'],
      }),

      delete_polytag_brand_invite({ email }),
    ]);

    return http_response({
      body: { message: 'Account created successfully.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /brand-authentication');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
