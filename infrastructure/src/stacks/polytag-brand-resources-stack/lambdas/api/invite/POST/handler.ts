/* -------------- Types -------------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { differenceBy } from 'lodash';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Models ---------- */
import { BrandDomain } from '_modules/brand-domains/models';

/* ---------- Modules ---------- */
import { get_brand } from '_modules/brands/functions/get/get-brand';
import { get_brand_domain } from '_modules/brand-domains/functions/get/get-brand-domain';
import { create_brand_user_invite } from '_modules/users/functions/create/create-brand-user-invite';
import { update_user_onboarding_steps } from '_modules/users/functions/update/update-user-onboarding-steps';
import { send_polytag_brand_user_invite_email } from '_modules/users/functions/send/send-polytag-brand-user-invite-email';
import { get_brand_invitation } from '_modules/brands/functions/get/get-brand-invitation';

/* ---------- Types ---------- */
import { Polytag } from '__@types/polytag';

/* ---------- Interfaces ---------- */
interface User {
  email: string;
  roles: Polytag.Role[];
}

interface Body {
  users: User[];
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;
    const { access_token } = headers;

    if (!access_token) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
          status_code: 401,
        }),
      );
    }

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, sub } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { users }: Body = JSON.parse(body);

    if (!users || !users.length) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    const { brand } = await get_brand({ brand_id });

    if (!brand) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['brand-does-not-exist'].code,
          message: error_messages['brand-does-not-exist'].message,
        }),
      );
    }

    const brand_emails_promises = users.map(user =>
      get_brand_invitation(user.email),
    );

    const brand_emails = await Promise.all(brand_emails_promises);

    const filtered_emails = differenceBy(
      users,
      brand_emails.filter(email => email !== null),
      'email',
    );

    if (!filtered_emails.length) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['email-already-invited'].code,
          message: error_messages['email-already-invited'].message,
        }),
      );
    }

    const received_domains = new Set(
      filtered_emails.map(user => {
        return user.email.split('@')[1];
      }),
    );

    const fetch_domains_promises = Array.from(received_domains).map(domain => {
      return get_brand_domain({ brand_id, domain });
    });

    const filtered_fetched_domains = (
      await Promise.all(fetch_domains_promises)
    ).filter(brand_domain => !!brand_domain) as { brand_domain: BrandDomain }[];

    const brand_domains = filtered_fetched_domains.map(
      ({ brand_domain }) => brand_domain.domain,
    );

    const invalid_domain = filtered_emails.some(user => {
      const user_domain = user.email.split('@')[1];

      return !brand_domains.includes(user_domain);
    });

    if (invalid_domain) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages['forbidden-email-domain'].code,
          message: error_messages['forbidden-email-domain'].message,
        }),
      );
    }

    const invite_promises = filtered_emails.map(u => {
      return [
        create_brand_user_invite({
          brand_id,
          email: u.email,
          roles: u.roles,
          sub,
        }),

        send_polytag_brand_user_invite_email({ email: u.email }),
      ];
    });

    await Promise.all(invite_promises.flat());

    await update_user_onboarding_steps({
      action: 'add',
      brand_id,
      steps: ['invite_colleagues'],
      user_sub: sub,
    });

    return http_response({
      body: { message: 'Users invited.' },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /invite');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
