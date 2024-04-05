/* ---------- External ---------- */
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { chunk } from 'lodash';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import {
  get_existing_gcp,
  GetExistingGCPOutput,
} from '_modules/brand-gcps/functions/get/get-existing-gcp';
import { add_gcps_to_brand } from '_modules/brands/functions/create/add-gcps-to-brand';

/* ---------- Schemas ---------- */
import { add_gcps_schema } from '_modules/brand-gcps/schemas';

/* ---------- Constants ---------- */
const BATCH_SIZE = 10;

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { headers, body } = event;

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, 'custom:brand_id': brand_id } =
      get_authenticated_user({
        token: id_token,
      });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['brand-gcps']?.includes('PUT') || !brand_id)
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    if (!body)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-body'].message,
          status_code: 400,
          code: error_messages['missing-required-body'].code,
        }),
      );

    const { gcps } = await add_gcps_schema.validate(JSON.parse(body), {
      abortEarly: true,
      stripUnknown: true,
    });

    const gcp_batches = chunk(gcps, BATCH_SIZE);

    const gcp_results: GetExistingGCPOutput[] = [];

    for (const gcp_batch of gcp_batches) {
      const results = await Promise.all(
        gcp_batch.map(gcp => get_existing_gcp({ gcp })),
      );

      results.forEach(({ brand_gcp }) => {
        if (!brand_gcp) return;

        gcp_results.push(brand_gcp);
      });
    }

    const forbidden_gcps = gcp_results.filter(
      ({ brand_ids }) => !brand_ids.includes(brand_id),
    );

    if (forbidden_gcps.length) {
      const failing_gcps = forbidden_gcps.map(({ gcp }) => gcp).join(', ');

      throw new Error(
        handle_http_error({
          message: `The GCP(s) ${failing_gcps} are already in use.`,
          status_code: 409,
          code: error_messages['gcp-already-registered'].code,
        }),
      );
    }

    const { brand_gcps } = await add_gcps_to_brand({
      brand_id,
      gcps: gcps as string[],
    });

    return http_response({
      body: { brand_gcps },
      status_code: 201,
    });
  } catch (error) {
    console.error('Error at PUT /brand-gcps');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
