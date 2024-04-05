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
import { create_labels_request } from '_modules/label/functions/create/create-labels-request';
import { get_printer_brand_association_by_brand_id } from '_modules/printer/functions/get/get-printer-brand-association-by-brand-id';

/* ---------- Clients ---------- */
import { sqs_client } from '_clients/sqs';

/* ---------- Interfaces ---------- */
interface Body {
  gtin: string;
  size: number;
  format: string;
  reference?: string;
}

interface Event extends APIGatewayProxyEventV2 {
  source?: string;
}

/* ---------- Constants ---------- */
const BATCH_SIZE = 200;
const ALLOWED_FORMATS = ['csv', 'xml', 'json'];

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
     * Checking if required params, body, authentication are
     * valid and present
     * ---------- */
    const { body, headers } = event;

    if (!body) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          message: error_messages['missing-required-body'].message,
          code: error_messages['missing-required-body'].code,
        }),
      );
    }

    const id_token = headers.Authorization || headers.authorization;

    const {
      'cognito:groups': cognito_groups,
      'custom:printer_id': printer_id,
      sub,
    } = get_authenticated_user({
      token: id_token,
    });

    const [group] = cognito_groups;

    if (
      !roles?.[group]?.['printer-serialised-codes']?.includes('POST') ||
      !printer_id
    )
      throw new Error(
        handle_http_error({
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
          status_code: 403,
        }),
      );

    const { gtin, size, format, reference }: Body = JSON.parse(body);

    if (size < 0) {
      throw new Error(
        handle_http_error({
          code: error_messages['invalid-size'].code,
          message: error_messages['invalid-size'].message,
          status_code: 400,
        }),
      );
    }

    if (!gtin || !size || !format) {
      throw new Error(
        handle_http_error({
          code: error_messages['missing-required-body'].code,
          message: error_messages['missing-required-body'].message,
          status_code: 400,
        }),
      );
    }

    if (size > 50_000) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['number-of-labels-over-limit'].code,
          message: error_messages['number-of-labels-over-limit'].message,
        }),
      );
    }

    if (!Utils.testRule(Utils.Rules.gtin, gtin)) {
      throw new Error(
        handle_http_error({
          code: error_messages['invalid-gtin'].code,
          message: error_messages['invalid-gtin'].message,
          status_code: 400,
        }),
      );
    }

    if (!ALLOWED_FORMATS.includes(format)) {
      throw new Error(
        handle_http_error({
          status_code: 400,
          code: error_messages['unrecognized-data-format'].code,
          message: error_messages['unrecognized-data-format'].message,
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

    const brand_id = product.partition_key.split('#')[1];

    const { brand_assocation } =
      await get_printer_brand_association_by_brand_id({
        brand_id,
        printer_id,
      });

    if (!brand_assocation) {
      throw new Error(
        handle_http_error({
          status_code: 403,
          code: error_messages.unauthorized.code,
          message: error_messages.unauthorized.message,
        }),
      );
    }

    const items_array = new Array(size).fill(0);

    /* ----------
     * Saving the request to DynamoDB
     * ---------- */
    const { labels_request } = await create_labels_request({
      sub,
      gtin,
      format,
      brand_id,
      reference,
      printer_id,
      labels_amount: size,
      batches_count: Math.ceil(size / BATCH_SIZE),
    });

    const request_id = labels_request.sort_key.split('#')[1];

    /* ----------
     * generating, validating & saving the
     * labels to DynamoDB and Timestream
     * ---------- */

    const items_batches = chunk(items_array, BATCH_SIZE);

    for (const [batch_index, { length: amount }] of items_batches.entries()) {
      const params: SendMessageCommandInput = {
        MessageBody: JSON.stringify({
          print_request: {
            sub,
            gtin,
            amount,
            brand_id,
            request_id,
            printer_id,
            batch_index,
          },
          command: 'create-confirmed',
        }),
        QueueUrl: QUEUE_URL,
        DelaySeconds: 0,
      };

      const command = new SendMessageCommand(params);

      await sqs_client.send(command);
    }

    console.log(
      `"Printer": user ${sub} requested ${size} labels for ${gtin} - V2`,
    );

    return http_response({
      body: { request_id },
      status_code: 202,
    });
  } catch (error) {
    console.error('Error at POST /printer-serialised-codes');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
