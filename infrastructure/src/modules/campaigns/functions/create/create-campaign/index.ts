/* ---------- External ---------- */
import { PutCommandInput, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Interfaces ---------- */
interface CampaignLandingPage {
  end_date: string;
  start_date: string;
  landing_page_sort_key: string;
  landing_page_name: string;
}

interface CampaignProductGroup {
  product_group_count: number;
  product_group_name: string;
  product_group_sort_key: string;
}

interface CreateCampaignInput {
  brand_id: string;
  campaign_landing_pages: CampaignLandingPage[];
  campaign_name: string;
  campaign_product_groups: CampaignProductGroup[];
  owner_name: string;
}

/* ---------- Function ---------- */
const create_campaign = async ({
  brand_id,
  campaign_landing_pages,
  campaign_name,
  campaign_product_groups,
  owner_name,
}: CreateCampaignInput) => {
  const new_campaign: Campaign = {
    campaign_landing_pages,
    campaign_name,
    campaign_product_groups,
    created_at: new Date().getTime(),
    created_by: owner_name,
    datatype: 'brand-campaign',
    partition_key: `brand#${brand_id}`,
    search: `brand-campaign#${campaign_name.replace(/\s/g, '_')}`,
    sort_key: `brand-campaign#${uuidv4()}`,
    updated_at: new Date().getTime(),
  };

  const params: PutCommandInput = {
    Item: new_campaign,
    TableName: process.env.TABLE_NAME,
  };

  const command = new PutCommand(params);

  await dynamodb_documentclient.send(command);

  return new_campaign;
};

/* ---------- Export ---------- */
export { create_campaign };
