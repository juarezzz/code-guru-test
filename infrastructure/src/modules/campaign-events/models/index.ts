/* ---------- External ---------- */
interface CampaignFormEventInterface {
  created_at: number;
  datatype: string;
  partition_key: string;
  sort_key: string;
  email: string;
  gtin: string;
  campaign_name: string;
  landing_page_name: string;
  product_name: string;
  serial?: string;
  checkboxes?: Array<{
    label: string;
    checked: boolean;
    mandatory: boolean;
  }>;
}

export class CampaignFormEvent implements CampaignFormEventInterface {
  created_at: number;

  datatype: string;

  partition_key: string;

  sort_key: string;

  email: string;

  gtin: string;

  campaign_id: string;

  campaign_name: string;

  landing_page_name: string;

  product_name: string;

  serial?: string;

  checkboxes?: Array<{
    label: string;
    checked: boolean;
    mandatory: boolean;
  }>;
}
