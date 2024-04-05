/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyEventV2,
} from 'aws-lambda';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';

/* ---------- Helpers ---------- */
import { log_lambda_metrics } from '_helpers/logs/log_lambda_metrics';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Modules ---------- */
import {
  LocationInfo,
  create_third_party_confirm_log,
} from '_modules/third-party/functions/create/create-third-party-confirm-log';
import { create_third_party_redeem_log } from '_modules/third-party/functions/create/create-third-party-redeem-log';
import { get_third_party_label } from '_modules/third-party/functions/get/get-third-party-label';
import { Label } from '_modules/label/models';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
import { roles } from '_constants/roles';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';

/* ---------- Interfaces ---------- */
interface Body {
  gtin: string;
  serial: string;
  operation: string;
  location?: LocationInfo;
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}
/* ---------- Constants ---------- */
const { LABELS_QUEUE_URL } = process.env;

/* ---------- Functions ---------- */
const send_sqs_message = async (label: Label) => {
  const params: SendMessageCommandInput = {
    MessageBody: JSON.stringify({ label }),
    QueueUrl: LABELS_QUEUE_URL,
    DelaySeconds: 0,
  };

  const command = new SendMessageCommand(params);

  await sqs_client.send(command);
};

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

      if (!LABELS_QUEUE_URL)
        throw new Error(
          handle_http_error({
            message: error_messages['internal-server-error'].message,
            status_code: 500,
            code: error_messages['internal-server-error'].code,
          }),
        );

      const { body, headers } = event;

      const id_token = headers.authorization || headers.Authorization;

      const {
        'cognito:groups': cognito_groups,
        'custom:third_party_id': third_party_id,
      } = get_authenticated_user({
        token: id_token,
      });

      if (
        !cognito_groups?.some(group =>
          roles?.[group]?.['third-party-labels']?.includes('PUT'),
        )
      )
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

      const { gtin, serial, operation, location }: Body = JSON.parse(body);

      if (!gtin || !serial || !operation)
        throw new Error(
          handle_http_error({
            message: error_messages['missing-required-body'].message,
            status_code: 400,
            code: error_messages['missing-required-body'].code,
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

      if (!third_party_label || !third_party_label.printed)
        throw new Error(
          handle_http_error({
            message:
              'Third party label not found for specified GTIN and serial.',
            status_code: 400,
            code: '000',
          }),
        );

      const { third_parties } = third_party_label;

      const third_party = third_parties.find(
        t => t.third_party_id === third_party_id,
      );

      switch (operation) {
        case 'redeem':
          if (third_party)
            throw new Error(
              handle_http_error({
                message:
                  'Third party label for provided GTIN and serial is already claimed.',
                status_code: 400,
                code: '000',
              }),
            );

          await Promise.all([
            send_sqs_message({
              ...third_party_label,
              third_parties: [
                ...third_parties,
                {
                  third_party_id,
                  redeemed_at: Date.now(),
                  confirmed_at: 0,
                  status: 'redeemed-pending',
                },
              ],
            }),

            create_third_party_redeem_log({
              serial,
              third_party_id,
              gtin: String(Number(gtin)),
            }),
          ]);

          break;

        case 'confirm-redeem': {
          if (!third_party)
            throw new Error(
              handle_http_error({
                message: 'Third party provider not found.',
                status_code: 400,
                code: '000',
              }),
            );

          if (third_party.status !== 'redeemed-pending')
            throw new Error(
              handle_http_error({
                code: '000',
                message:
                  'Third party label for provided GTIN and serial is not redeemed yet.',
                status_code: 400,
              }),
            );

          const promises = [
            send_sqs_message({
              ...third_party_label,
              third_parties: [
                ...third_parties.filter(
                  t => t.third_party_id !== third_party_id,
                ),
                {
                  ...third_party,
                  confirmed_at: Date.now(),
                  status: 'redeemed-claimed',
                },
              ],
            }),

            create_third_party_confirm_log({
              serial,
              location,
              third_party_id,
              gtin: String(Number(gtin)),
            }),
          ];

          await Promise.all(promises);

          break;
        }

        default:
          throw new Error(
            handle_http_error({
              code: '000',
              message: 'The operation is not supported.',
              status_code: 400,
            }),
          );
      }

      return http_response({
        body: { message: 'Successfully updated third party label.' },
        status_code: 200,
      });
    } catch (error) {
      console.error('Error at PUT /third-party-labels');
      console.error(error);

      return handle_http_error_response({ error });
    }
  });
