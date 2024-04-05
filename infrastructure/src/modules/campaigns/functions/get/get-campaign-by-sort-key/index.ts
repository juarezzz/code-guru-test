/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Model ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Interfaces ---------- */
interface GetCampaignBySortKey {
  brand_id: string;
  campaign_sort_key: string;
}

/* ---------- Function ---------- */
const get_campaign_by_sort_key = async ({
  campaign_sort_key,
  brand_id,
}: GetCampaignBySortKey) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND sort_key = :sort_key',
    ExpressionAttributeValues: {
      ':partition_key': `brand#${brand_id}`,
      ':sort_key': campaign_sort_key,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return undefined;

  return Items[0] as Campaign;
};

/* ---------- Export ---------- */
export { get_campaign_by_sort_key };
