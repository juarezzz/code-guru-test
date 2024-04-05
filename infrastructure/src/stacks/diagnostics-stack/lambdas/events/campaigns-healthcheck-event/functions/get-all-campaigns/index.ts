import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

const get_all_campaigns = async () => {
  const campaigns: Campaign[] = [];
  let last_evaluated_key: Record<string, unknown> | undefined;

  do {
    const query_params: QueryCommandInput = {
      TableName: process.env.TABLE_NAME,
      IndexName: 'datatype-index',
      KeyConditionExpression: 'datatype = :datatype',
      ExpressionAttributeValues: {
        ':datatype': 'brand-campaign',
      },
      ExclusiveStartKey: last_evaluated_key,
    };

    const query_command = new QueryCommand(query_params);

    const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
      query_command,
    );

    if (Items?.length) campaigns.push(...(Items as Campaign[]));

    last_evaluated_key = LastEvaluatedKey;
  } while (last_evaluated_key);

  return campaigns;
};

export { get_all_campaigns };
