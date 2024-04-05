/* ---------- External ---------- */

/* ---------- Clients ---------- */
import { QueryCommand, QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { CampaignFormEvent } from '_modules/campaign-events/models';

/* ---------- Interfaces ---------- */
interface GetFormEventsInput {
  brand_id: string;
  campaign_id: string;
  last_evaluated_key: Record<string, unknown> | undefined;
}

/* ---------- Function ---------- */
const get_form_events_by_campaign_id = async ({
  brand_id,
  campaign_id,
  last_evaluated_key,
}: GetFormEventsInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(sort_key, :sort_key)',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': `campaign-event#${campaign_id}#form-event`,
    },
    ExclusiveStartKey: last_evaluated_key,
  };

  const command = new QueryCommand(params);

  const { Items, LastEvaluatedKey } = await dynamodb_documentclient.send(
    command,
  );

  if (!Items)
    return {
      form_events: [] as CampaignFormEvent[],
      last_evaluated_key: undefined,
    };

  return {
    form_events: Items as CampaignFormEvent[],
    last_evaluated_key: LastEvaluatedKey || undefined,
  };
};

/* ---------- Export ---------- */
export { get_form_events_by_campaign_id };
