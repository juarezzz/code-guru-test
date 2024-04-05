/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandGCP } from '_modules/brand-gcps/models';

/* ---------- Interfaces ---------- */
interface CreateBrandGCPInput {
  gcp: string;
  brand_id: string;
  created_by: string;
}

/* ---------- Function ---------- */
const create_brand_gcp = async ({
  gcp,
  brand_id,
  created_by,
}: CreateBrandGCPInput) => {
  const new_gcp: BrandGCP = {
    gcp,
    created_by,
    datatype: 'brand-gcp',
    sort_key: `brand-gcp#${gcp}`,
    created_at: new Date().getTime(),
    partition_key: `brand#${brand_id}`,
  };

  const params: PutCommandInput = {
    Item: new_gcp,
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_not_exists(#sort_key) AND attribute_not_exists(#partition_key)',
    ExpressionAttributeNames: {
      '#sort_key': 'sort_key',
      '#partition_key': 'partition_key',
    },
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return new_gcp;
};

/* ---------- Export ---------- */
export { create_brand_gcp };
