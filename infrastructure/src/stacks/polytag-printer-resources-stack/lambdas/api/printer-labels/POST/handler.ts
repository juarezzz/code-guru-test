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
import { DigitalLink, Utils } from 'digital-link.js';

/* ---------- Helpers ---------- */
import { unique_serial } from '_helpers/utils/unique-serial';
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
  size: number;
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

export const handler: APIGatewayProxyHandlerV2 = async (
  event: Event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { RESOLVER_DOMAIN, QUEUE_URL } = process.env;

    if (!QUEUE_URL) {
      throw new Error(
        handle_http_error({
          status_code: 500,
          code: error_messages['internal-server-error'].code,
          message: error_messages['internal-server-error'].message,
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

    if (!roles?.[group]?.['printer-labels']?.includes('POST')) {
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );
    }

    const { gtin, size }: Body = JSON.parse(body);

    if (
      !gtin ||
      !size ||
      !Utils.testRule(Utils.Rules.gtin, gtin) ||
      size > 2000
    ) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
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

    const labels_array = [...Array(Number(size)).keys()].map(() => {
      const label = DigitalLink({
        domain: `https://${RESOLVER_DOMAIN}`,
        identifier: {
          '01': gtin,
        },
        keyQualifiers: {
          '21': unique_serial(),
        },
      });

      return label;
    });

    /* ----------
     * Saving the labels to DynamoDB
     * ---------- */
    const batches = chunk(
      labels_array.map(label => ({
        gtin,
        sub,
        brand_id: product.partition_key.replace('brand#', ''),
        serial: label.getKeyQualifier('21'),
      })),
      200,
    );

    for (const batch of batches) {
      const params: SendMessageCommandInput = {
        MessageBody: JSON.stringify({ serials: batch, command: 'create' }),
        QueueUrl: QUEUE_URL,
        DelaySeconds: 0,
      };

      const command = new SendMessageCommand(params);

      await sqs_client.send(command);
    }

    const digital_link_labels = labels_array.map(label =>
      label.toWebUriString(),
    );

    console.log(
      `"Printer": user ${sub} requested ${digital_link_labels.length} labels for ${gtin}`,
    );

    return http_response({
      body: { labels: digital_link_labels },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at POST /printer-labels');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
