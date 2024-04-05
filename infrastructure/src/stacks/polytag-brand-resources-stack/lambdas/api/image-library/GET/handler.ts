/* ---------- External ---------- */
import { v4 as uuidv4 } from 'uuid';
import {
  APIGatewayProxyHandlerV2,
  APIGatewayProxyStructuredResultV2,
} from 'aws-lambda';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';

/* ---------- Helpers ---------- */
import { http_response } from '_helpers/responses/http-response';
import { handle_http_error } from '_helpers/handlers/handle-http-error';
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';

/* ---------- Modules ---------- */
import { get_image_by_name } from '_modules/image-library/functions/get/get-image-by-name';

/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    if (!queryStringParameters)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    const { file_name } = queryStringParameters;

    if (!file_name)
      throw new Error(
        handle_http_error({
          message: error_messages['missing-required-query-string'].message,
          status_code: 400,
          code: error_messages['missing-required-query-string'].code,
        }),
      );

    if (!file_name.match(/\.(gif|png|svg|jpe?g)$/i))
      throw new Error(
        handle_http_error({
          message: error_messages['invalid-file'].message,
          status_code: 400,
          code: error_messages['invalid-file'].code,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { 'custom:brand_id': brand_id, sub } = get_authenticated_user({
      token: id_token,
    });

    if (!brand_id) {
      throw new Error(
        handle_http_error({
          message: error_messages['brand-does-not-exist'].message,
          status_code: 403,
          code: error_messages['brand-does-not-exist'].code,
        }),
      );
    }

    const image_name = file_name.replace(/\.(gif|png|svg|jpe?g)$/i, '');

    const { image } = await get_image_by_name({
      brand_id,
      image_name,
    });

    if (image) {
      throw new Error(
        handle_http_error({
          message: error_messages['duplicate-image-name'].message,
          status_code: 403,
          code: error_messages['duplicate-image-name'].code,
        }),
      );
    }

    const { BUCKET_NAME } = process.env;

    const key = `${brand_id}/${file_name}`;
    const partition_key = `brand#${brand_id}`;
    const sort_key = `brand-image#${uuidv4()}`;

    const params: PutObjectCommandInput = {
      Bucket: BUCKET_NAME,
      ContentType: 'image/*',
      Key: key,
      StorageClass: 'STANDARD',
      ACL: 'public-read',
      Metadata: {
        created_by: sub,
        partition_key,
        sort_key,
      },
    };

    const command = new PutObjectCommand(params);

    const url = await getSignedUrl(s3_client, command, {
      expiresIn: 3600,
    });

    return http_response({
      body: {
        url,
        partition_key,
        sort_key,
      },
      status_code: 200,
    });
  } catch (error) {
    console.error('Error at GET /image-library');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
