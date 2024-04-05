/* ---------- Interfaces ---------- */
export interface CampaignLandingPage {
  end_date: string;
  landing_page_sort_key: string;
  landing_page_name: string;
  start_date: string;
}

export interface CampaignProductGroup {
  product_group_name: string;
  product_group_count: number;
  product_group_sort_key: string;
}

interface CampaignInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;

  campaign_name: string;

  campaign_product_groups: CampaignProductGroup[];
  campaign_landing_pages: CampaignLandingPage[];

  created_at: number;
  created_by: string;
  updated_at: number;
  search: string;
}

export class Campaign implements CampaignInterface {
  campaign_landing_pages: CampaignLandingPage[];

  campaign_name: string;

  campaign_product_groups: CampaignProductGroup[];

  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  search: string;

  sort_key: string;

  updated_at: number;
}
