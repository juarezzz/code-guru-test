/* ---------- External ---------- */
import { chunk } from 'lodash';
import {
  APIGatewayProxyEventV2,
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import {
  SendMessageCommand,
  SendMessageCommandInput,
} from '@aws-sdk/client-sqs';
import { Utils } from 'digital-link.js';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Constants ---------- */
import { roles } from '_constants/roles';
import { error_messages } from '_constants/error-messages';

/* ---------- Modules ---------- */
import { get_product_by_gtin } from '_modules/products/functions/get/get-product-by-gtin';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';

/* ---------- Interfaces ---------- */
interface Body {
  gtin: string;
  serials: string[];
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { QUEUE_URL } = process.env;

    if (!QUEUE_URL) {
      throw new Error(
        handle_http_error({
          message: error_messages['internal-server-error'].message,
          status_code: 500,
          code: error_messages['internal-server-error'].code,
        }),
      );
    }

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
     * Checking if required params, body, authentication are
     * valid and present
     * ---------- */
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

    const id_token = headers.Authorization || headers.authorization;

    const { 'cognito:groups': cognito_groups, sub } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (!roles?.[group]?.['printer-labels']?.includes('PUT'))
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { gtin, serials }: Body = JSON.parse(body);

    if (
      !gtin ||
      !Utils.testRule(Utils.Rules.gtin, gtin) ||
      serials?.length > 2000 ||
      (serials?.length || 0) === 0 ||
      serials.findIndex((serial: string) => serial.length !== 12) !== -1
    ) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    const { product } = await get_product_by_gtin({ gtin });

    if (!product) {
      throw new Error(
        handle_http_error({
          status_code: 404,
          code: error_messages['product-does-not-exist'].code,
          message: error_messages['product-does-not-exist'].message,
        }),
      );
    }

    /* ----------
     * Saving the labels to DynamoDB
     * ---------- */
    const batches = chunk(
      serials.map(serial => ({
        gtin,
        sub,
        brand_id: product.partition_key.replace('brand#', ''),
        serial,
      })),
      200,
    );

    for (const batch of batches) {
      const params: SendMessageCommandInput = {
        MessageBody: JSON.stringify({ serials: batch, command: 'confirm' }),
        QueueUrl: QUEUE_URL,
        DelaySeconds: 0,
      };

      const command = new SendMessageCommand(params);

      await sqs_client.send(command);
    }

    console.log(
      `"Printer": User:${sub}, confirmed ${serials.length} labels for ${gtin}`,
    );

    return http_response({
      body: { message: 'Serials are being confirmed.' },
      status_code: 202,
    });
  } catch (error) {
    console.error('Error at PUT /printer-labels');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
