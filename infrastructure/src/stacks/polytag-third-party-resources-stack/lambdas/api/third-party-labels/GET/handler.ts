/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyEventV2,
} from 'aws-lambda';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';

/* ---------- Modules ---------- */
import { get_third_party_label } from '_modules/third-party/functions/get/get-third-party-label';
import { create_third_party_scan_log } from '_modules/third-party/functions/create/create-third-party-scan-log';
import { Label } from '_modules/label/models';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Interfaces ---------- */
interface Response {
  code: string;
  last_updated_at?: number;
  message: string;
  status: string;
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  ev: Event,
): Promise<APIGatewayProxyStructuredResultV2> =>
  log_lambda_metrics(ev, async event => {
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

      const { queryStringParameters, headers } = event;

      const id_token = headers.authorization || headers.Authorization;

      const {
        'custom:third_party_id': third_party_id,
        'cognito:groups': cognito_groups,
      } = get_authenticated_user({ token: id_token });

      const [group] = cognito_groups;

      if (!roles?.[group]?.['third-party-labels']?.includes('GET'))
        throw new Error(
          handle_http_error({
            code: error_messages.unauthorized.code,
            message: error_messages.unauthorized.message,
            status_code: 403,
          }),
        );

      if (!queryStringParameters)
        throw new Error(
          handle_http_error({
            message: error_messages['missing-required-query-string'].message,
            status_code: 400,
            code: error_messages['missing-required-query-string'].code,
          }),
        );

      const { gtin, serial } = queryStringParameters;

      if (!gtin || !serial)
        throw new Error(
          handle_http_error({
            message: error_messages['missing-required-query-string'].message,
            status_code: 400,
            code: error_messages['missing-required-query-string'].code,
          }),
        );

      if (
        !cognito_groups?.some(user_group =>
          roles?.[user_group]?.['third-party-labels']?.includes('GET'),
        )
      )
        throw new Error(
          handle_http_error({
            code: error_messages.unauthorized.code,
            message: error_messages.unauthorized.message,
            status_code: 403,
          }),
        );

      let third_party_label: Label | null;

      third_party_label = (
        await get_third_party_label({
          gtin: String(Number(gtin)),
          serial,
          table_name: process.env.LABELS_TABLE_NAME,
        })
      ).third_party_label;

      if (!third_party_label)
        third_party_label = (
          await get_third_party_label({
            gtin: String(Number(gtin)),
            serial,
            table_name: process.env.MAIN_TABLE_NAME,
          })
        ).third_party_label;

      const response: Response = {
        code: '000',
        message: 'Invalid third party label',
        status: 'invalid',
      };

      if (!third_party_label || !third_party_label.printed) {
        response.code = '001';
        response.message = "There's no third party label for this product";
        response.status = 'does-not-exist';

        return http_response({ body: { ...response }, status_code: 200 });
      }

      await create_third_party_scan_log({
        serial,
        third_party_id,
        gtin: String(Number(gtin)),
      });

      const { third_parties } = third_party_label;

      const third_party_index = third_parties.findIndex(
        third_party => third_party.third_party_id === third_party_id,
      );

      if (third_party_index === -1) {
        response.code = '002';
        response.message =
          "This third party label is available and it's not claimed yet";
        response.status = 'unredeemed-claimable';

        return http_response({ body: { ...response }, status_code: 200 });
      }

      const { status } = third_parties[third_party_index];

      if (status === 'redeemed-pending') {
        response.code = '003';
        response.message =
          'This third party label was claimed and is pending for approval';
        response.status = 'redeemed-pending';

        return http_response({ body: { ...response }, status_code: 200 });
      }

      if (status === 'redeemed-claimed') {
        response.code = '004';
        response.message = 'This third party label was claimed and approved';
        response.status = 'redeemed-claimed';

        return http_response({ body: { ...response }, status_code: 200 });
      }

      return http_response({ body: { ...response }, status_code: 200 });
    } catch (error) {
      console.error('Error at GET /third-party-labels');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
