/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Image } from '_modules/image-library/models';

/* ---------- Utils ---------- */
import { decode_last_key } from '_helpers/database/decode-last-key';
import { encode_last_key } from '_helpers/database/encode-last-key';

/* ---------- Types ---------- */
interface GetAllImagesByNameInput {
  brand_id: string;
  last_key?: string;
  image_name: string;
}

/* ---------- Function ---------- */
const get_all_images_by_name = async ({
  brand_id,
  last_key,
  image_name,
}: GetAllImagesByNameInput) => {
  const search = `brand-image#${image_name
    .replace(/\s/g, '_')
    .toLocaleLowerCase()}`;

  const decoded_last_key = decode_last_key({ last_key });

  const exclusive_start_key = decoded_last_key && {
    search: decoded_last_key.search,
    partition_key: `brand#${brand_id}`,
    sort_key: decoded_last_key.sort_key,
  };

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(#search, :search)',
    ExpressionAttributeNames: {
      '#search': 'search',
    },
    ExpressionAttributeValues: {
      ':search': search,
      ':partition_key': `brand#${brand_id}`,
    },
    ExclusiveStartKey: exclusive_start_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  const last_evaluated_key = encode_last_key({
    last_evaluated_key: LastEvaluatedKey,
    preserve: ['sort_key', 'search'],
  });

  return { images: Items as Image[], last_evaluated_key };
};

/* ---------- Export ---------- */
export { get_all_images_by_name };
