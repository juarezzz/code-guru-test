/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Label } from '_modules/label/models';

/* ---------- Interfaces ---------- */
export interface GetAllLabels {
  brand_id?: string;
  last_key: Record<string, unknown> | undefined;
}

export interface GetAllLabelsResponse {
  labels: Label[];
  last_evaluated_key: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_all_labels = async ({
  brand_id,
  last_key,
}: GetAllLabels): Promise<GetAllLabelsResponse> => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    IndexName: 'datatype-pk-index',
    KeyConditionExpression: brand_id
      ? 'datatype = :datatype AND partition_key = :partition_key'
      : 'datatype = :datatype',
    ExpressionAttributeValues: {
      ':datatype': 'brand-label',
    },
  };

  if (brand_id)
    params.ExpressionAttributeValues = {
      ...params.ExpressionAttributeValues,
      ':partition_key': `brand#${brand_id}`,
    };

  if (last_key) {
    params.ExclusiveStartKey = last_key;
  }

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  return { labels: Items as Label[], last_evaluated_key: LastEvaluatedKey };
};

/* ---------- Export ---------- */
export { get_all_labels };
