/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Image } from '_modules/image-library/models';

/* ---------- Interfaces ---------- */
interface GetImageByNameInput {
  brand_id: string;
  image_name: string;
}

/* ---------- Function ---------- */
const get_image_by_name = async ({
  brand_id,
  image_name,
}: GetImageByNameInput) => {
  const search = `brand-image#${image_name
    .replace(/\s/g, '_')
    .toLocaleLowerCase()}`;

  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    Limit: 1,
    KeyConditionExpression:
      'partition_key = :partition_key AND #search = :search',
    ExpressionAttributeNames: {
      '#search': 'search',
    },
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':search': search,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  return { image: Items?.[0] as Image | undefined };
};

/* ---------- Export ---------- */
export { get_image_by_name };
