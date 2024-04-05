/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Mrf } from '_modules/mrfs/models';

/* ---------- Interfaces ---------- */
interface UpdateMrf {
  mrf_id: string;
  latitude: number;
  longitude: number;
}

/* ---------- Function ---------- */
const update_mrf = async ({ latitude, longitude, mrf_id }: UpdateMrf) => {
  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `mrf#${mrf_id}`,
      sort_key: `mrf`,
    },
    ExpressionAttributeValues: {
      ':location': { latitude, longitude },
    },
    ExpressionAttributeNames: {
      '#partition_key': 'partition_key',
      '#sort_key': 'sort_key',
      '#location': 'location',
    },
    UpdateExpression: 'SET #location = :location',
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return Attributes as Mrf;
};

/* ---------- Export ---------- */
export { update_mrf };
