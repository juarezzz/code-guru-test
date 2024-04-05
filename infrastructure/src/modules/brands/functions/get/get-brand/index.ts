/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';

/* ---------- Interfaces ---------- */
interface GetBrand {
  brand_id: string;
}

/* ---------- Function ---------- */
const get_brand = async ({ brand_id }: GetBrand) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': 'brand',
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || !Items.length) return { brand: null };

  return { brand: Items[0] as Brand };
};

/* ---------- Export ---------- */
export { get_brand };
