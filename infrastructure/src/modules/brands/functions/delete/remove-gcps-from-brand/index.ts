/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Brand } from '_modules/brands/models';

/* ---------- Interfaces ---------- */
interface RemoveGCPsFromBrandInput {
  gcps: string[];
  brand_id: string;
}

/* ---------- Function ---------- */
const remove_gcps_from_brand = async ({
  gcps,
  brand_id,
}: RemoveGCPsFromBrandInput) => {
  const update_params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    Key: { partition_key: `brand#${brand_id}`, sort_key: 'brand' },
    ReturnValues: 'ALL_NEW',
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    UpdateExpression: 'DELETE #gcp_list :gcps',
    ExpressionAttributeNames: {
      '#gcp_list': 'gcp_list',
      '#sort_key': 'sort_key',
      '#partition_key': 'partition_key',
    },
    ExpressionAttributeValues: {
      ':gcps': new Set<string>(gcps),
    },
  };

  const command = new UpdateCommand(update_params);

  const { Attributes } = await dynamodb_documentclient.send(command);

  return { brand_gcps: Array.from((Attributes as Brand).gcp_list || []) };
};

/* ---------- Export ---------- */
export { remove_gcps_from_brand };
