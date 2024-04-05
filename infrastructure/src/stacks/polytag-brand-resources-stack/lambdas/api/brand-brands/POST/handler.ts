/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { http_response } from '_helpers/responses/http-response';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

/* ---------- Models ---------- */
import { BrandUserRole } from '_modules/users/models/user';

/* ---------- Modules ---------- */
import { create_brand } from '_modules/brands/functions/create/create-brand';
import { create_brand_user } from '_modules/users/functions/create/create-brand-user';
import { create_brand_domain } from '_modules/brand-domains/functions/create/create-brand-domain';
import { update_brand_user_attributes } from '_modules/users/functions/update/update-brand-user-attributes';

/* ---------- Schemas ---------- */
import { create_brand_schema } from '_modules/brands/schemas';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { body, headers } = event;

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
        }),
      );
    }

    if (!headers.access_token) {
      throw new Error(
        handle_http_error({
          status_code: 401,
          code: error_messages['missing-access-token'].code,
          message: error_messages['missing-access-token'].message,
        }),
      );
    }

    /* ----------
     * We do like this so we can make the function work
     * both locally and live
     * ---------- */
    const authorization_header = headers.Authorization || headers.authorization;

    const {
      sub,
      email_verified,
      email,
      'custom:full_name': full_name,
      'custom:job_title': job_title,
      'cognito:groups': groups,
    } = get_authenticated_user({
      token: authorization_header,
    });

    if (!sub || !email_verified || !email)
      throw new Error(
        handle_http_error({
          status_code: 401,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );

    const { industry, brand_name, gs1_territory, organisation_size } =
      await create_brand_schema.validate(JSON.parse(body));

    const domain = email.split('@')[1];

    const { brand } = await create_brand({
      sub,
      industry,
      brand_name,
      gs1_territory,
      organisation_size,
    });

    const promises = [
      create_brand_user({
        sub,
        email,
        full_name,
        job_title,
        role: groups[0] as BrandUserRole,
        steps: ['create_brand'],
        brand_id: brand.partition_key.replace('brand#', ''),
      }),

      create_brand_domain({
        domain,
        status: 'Main domain',
        brand_id: brand.partition_key.replace('brand#', ''),
      }),

      update_brand_user_attributes({
        user_sub: sub,
        brand_id: brand.partition_key.replace('brand#', ''),
        access_token: headers.access_token,
        attributes: [
          {
            Name: 'custom:brand_id',
            Value: brand.partition_key.replace('brand#', ''),
          },
        ],
      }),
    ] as const;

    const [user] = await Promise.all(promises);

    const transformed_brand = {
      ...brand,
      gcp_list: Array.from(brand.gcp_list || []),
    };

    return http_response({
      status_code: 200,
      body: { brand: transformed_brand, user },
    });
  } catch (error) {
    return handle_http_error_response({ error });
  }
};
