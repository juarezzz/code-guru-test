/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Image } from '_modules/image-library/models';

/* ---------- Interfaces ---------- */
interface GetAdminImageByName {
  image_name: string;
}

/* ---------- Function ---------- */
const get_admin_image_by_name = async ({ image_name }: GetAdminImageByName) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'search-pk-index',
    KeyConditionExpression:
      'partition_key = :partition_key AND #search = :search',
    ExpressionAttributeNames: {
      '#search': 'search',
    },
    ExpressionAttributeValues: {
      ':partition_key': `admin`,
      ':search': `admin-image#${image_name
        .replace(/\s/g, '_')
        .toLocaleLowerCase()}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { image: null };

  return { image: Items[0] as Image };
};

/* ---------- Export ---------- */
export { get_admin_image_by_name };
