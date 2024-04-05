/* ---------- External ---------- */
import {
  APIGatewayProxyStructuredResultV2,
  APIGatewayProxyHandlerV2,
} from 'aws-lambda';
import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Helpers ---------- */
import { get_authenticated_user } from '_helpers/auth/get/get-authenticated-user';
import { handle_http_error_response } from '_helpers/handlers/handle-http-error-response';
import { httpError } from '_helpers/errors/httpError';
import { http_response } from '_helpers/responses/http-response';

/* ---------- Clients ---------- */
import { s3_client } from '_clients/s3';

/* ---------- Modules ---------- */
import { get_admin_image_by_name } from '_modules/image-library/functions/get/get-admin-image-by-name';

export const handler: APIGatewayProxyHandlerV2 = async (
  event,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const { queryStringParameters, headers } = event;

    if (!queryStringParameters)
      throw new Error(
        httpError({
          message: 'Query string parameters are required.',
          status_code: 400,
        }),
      );

    const { file_name } = queryStringParameters;

    if (!file_name)
      throw new Error(
        httpError({ message: 'File name is required.', status_code: 400 }),
      );

    if (!file_name.match(/\.(gif|png|svg|jpe?g)$/i))
      throw new Error(
        httpError({
          message: 'File name must be a valid image file.',
          status_code: 400,
        }),
      );

    const id_token = headers.Authorization || headers.authorization;

    const { sub } = get_authenticated_user({ token: id_token });

    const { image } = await get_admin_image_by_name({
      image_name: file_name.replace(/\.(gif|png|svg|jpe?g)$/i, ''),
    });

    if (image)
      throw new Error(
        httpError({
          message: 'Image with this name already exists.',
          status_code: 400,
        }),
      );

    const { BUCKET_NAME } = process.env;

    const key = `common/admin-library-assets/${file_name
      .replace(/\s/g, '_')
      .toLocaleLowerCase()}`;

    const partition_key = `admin`;
    const sort_key = `admin-image#${uuidv4()}`;

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
    console.error('Error at POST /admin-image-library');
    console.error(error);

    return handle_http_error_response({ error });
  }
};
