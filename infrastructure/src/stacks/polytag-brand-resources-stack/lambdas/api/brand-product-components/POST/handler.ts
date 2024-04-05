/* ---------- External ---------- */
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { uniqBy } from 'lodash';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Modules ---------- */
import { create_product_components } from '_modules/product-components/functions/create/create-product-components';

/* ---------- Interfaces ---------- */
interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
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

    const { body, headers } = event;

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const {
      sub,
      'cognito:groups': cognito_groups,
      'custom:brand_id': brand_id,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles[group]['brand-product-components'].includes('POST'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { components } = JSON.parse(body);

    if (!components)
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );

    if (
      components.length !== uniqBy(components, ({ name }) => name).length ||
      components.length !== uniqBy(components, ({ id }) => id).length
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages['duplicate-components-id'].code,
          message: error_messages['duplicate-components-id'].message,
          status_code: 400,
        }),
      );
    }

    const { product_components } = await create_product_components({
      sub,
      brand_id,
      components,
    });

    return http_response({
      body: { product_components },
      status_code: 201,
    });
  } catch (error) {
    console.error('Error at POST /brand-product-components');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
