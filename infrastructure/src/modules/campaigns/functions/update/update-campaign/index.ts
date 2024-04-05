/* ---------- External ---------- */
import { UpdateCommand, UpdateCommandInput } from '@aws-sdk/lib-dynamodb';

/* ---------- Clients ---------- */
import { dynamodb_documentclient } from '_clients/dynamodb';

/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Interfaces ---------- */
interface CampaignLandingPage {
  end_date?: string;
  start_date?: string;
  landing_page_name?: string;
  landing_page_sort_key?: string;
}

interface CampaignProductGroup {
  product_group_count: number;
  product_group_name: string;
  product_group_sort_key: string;
}

interface UpdateCampaign {
  campaign_landing_pages: CampaignLandingPage[];
  campaign_name: string;
  campaign_product_groups: CampaignProductGroup[];
  campaign_sort_key: string;
  brand_id: string;
}

/* ---------- Function ---------- */
const update_campaign = async ({
  campaign_name,
  campaign_product_groups,
  campaign_sort_key,
  campaign_landing_pages,
  brand_id,
}: UpdateCampaign) => {
  const update_expression = [
    campaign_name !== undefined && `campaign_name = :campaign_name`,

    campaign_product_groups !== undefined &&
      `campaign_product_groups = :campaign_product_groups`,

    campaign_landing_pages !== undefined &&
      `campaign_landing_pages = :campaign_landing_pages`,

    `updated_at = :updated_at`,
  ]
    .filter(expression => expression)
    .join(', ');

  const expression_values: Record<
    string,
    string | number | string[] | CampaignProductGroup[] | CampaignLandingPage[]
  > = {};

  const expression_names: Record<string, string> = {
    '#partition_key': 'partition_key',
    '#sort_key': 'sort_key',
  };

  if (campaign_name !== undefined)
    expression_values[':campaign_name'] = campaign_name;

  if (campaign_product_groups !== undefined)
    expression_values[':campaign_product_groups'] = campaign_product_groups;

  if (campaign_landing_pages !== undefined)
    expression_values[':campaign_landing_pages'] = campaign_landing_pages;

  expression_values[':updated_at'] = Date.now();

  const params: UpdateCommandInput = {
    TableName: process.env.TABLE_NAME,
    ConditionExpression:
      'attribute_exists(#sort_key) AND attribute_exists(#partition_key)',
    Key: {
      partition_key: `brand#${brand_id}`,
      sort_key: campaign_sort_key,
    },
    ExpressionAttributeValues: {
      ...expression_values,
    },
    ExpressionAttributeNames: {
      ...expression_names,
    },
    UpdateExpression: `
      SET ${update_expression}
    `,
    ReturnValues: 'ALL_NEW',
  };

  const command = new UpdateCommand(params);

  const { Attributes: ReturnedAttributes } = await dynamodb_documentclient.send(
    command,
  );

  return { campaign: ReturnedAttributes as Campaign };
};

/* ---------- Export ---------- */
export { update_campaign };
