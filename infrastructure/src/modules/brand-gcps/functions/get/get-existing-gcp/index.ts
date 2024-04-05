/* ---------- External ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { BrandGCP } from '_modules/brand-gcps/models';

/* ---------- Interfaces ---------- */
export interface GetExistingGCPInput {
  gcp: string;
}

export interface GetExistingGCPOutput {
  gcp: string;
  brand_ids: string[];
}

/* ---------- Function ---------- */
const get_existing_gcp = async ({
  gcp,
}: GetExistingGCPInput): Promise<{ brand_gcp?: GetExistingGCPOutput }> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-sk-index',
    KeyConditionExpression: 'datatype = :datatype AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':datatype': 'brand-gcp',
      ':sort_key': `brand-gcp#${gcp}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items?.[0])
    return {
      brand_gcp: undefined,
    };

  const typed_gcps = Items as BrandGCP[];

  return {
    brand_gcp: {
      gcp: typed_gcps[0].gcp,
      brand_ids: typed_gcps?.map(
        ({ partition_key }) => partition_key.split('#')[1],
      ),
    },
  };
};

/* ---------- Export ---------- */
export { get_existing_gcp };
