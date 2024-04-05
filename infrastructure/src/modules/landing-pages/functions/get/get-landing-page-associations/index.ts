/* ---------- External ---------- */
import { QueryCommandInput, QueryCommand } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Types ---------- */
import { CampaignToLandingPageAssociation } from '_modules/landing-pages/models/campaign-to-landing-page-association';

/* ---------- Interfaces ---------- */
interface GetLandingPageAssociationsInput {
  sort_key: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const get_landing_page_associations = async ({
  brand_id,
  sort_key,
}: GetLandingPageAssociationsInput) => {
  const params: QueryCommandInput = {
    TableName: process.env.TABLE_NAME,
    KeyConditionExpression:
      'partition_key = :partition_key AND begins_with(sort_key, :sort_key_prefix)',
    ExpressionAttributeValues: {
      ':sort_key_prefix': `${sort_key}brand-campaign#`,
      ':partition_key': `brand#${brand_id}`,
    },
  };

  const command = new QueryCommand(params);

  const { Items } = await dynamodb_documentclient.send(command);

  if (!Items || Items.length === 0) return [];

  return Items as CampaignToLandingPageAssociation[];
};

/* ---------- Export ---------- */
export { get_landing_page_associations };
