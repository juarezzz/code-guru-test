/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandGCP } from '_modules/brand-gcps/models';

/* ---------- Interfaces ---------- */
interface GetAllBrandGCPsInput {
  brand_id: string;
  last_evaluated_key: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_all_brand_gcps = async ({
  brand_id,
  last_evaluated_key,
}: GetAllBrandGCPsInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression:
      'datatype = :datatype AND partition_key = :partition_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-gcp',
      ':partition_key': `brand#${brand_id}`,
    },
  };

  if (last_evaluated_key)
    params.ExclusiveStartKey = {
      datatype: 'brand-gcp',
      sort_key: last_evaluated_key.sort_key,
      partition_key: `brand#${brand_id}`,
    };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  if (!Items)
    return {
      brand_gcps: [] as BrandGCP[],
      last_evaluated_key: undefined,
    };

  return {
    brand_gcps: Items as BrandGCP[],
    last_evaluated_key: LastEvaluatedKey || undefined,
  };
};

/* ---------- Export ---------- */
export { get_all_brand_gcps };
