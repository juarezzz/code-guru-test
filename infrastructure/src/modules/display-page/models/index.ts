/* ---------- Interfaces ---------- */
interface DisplayPageInterface {
  campaign_id: string;
  created_at: number;
  datatype: string;
  landing_page_id: string;
  partition_key: string;
  product_group_id: string;
  product_id: string;
  runs_until?: number;
  sort_key: string;
  starts_on?: number;
}

export class DisplayPage implements DisplayPageInterface {
  campaign_id: string;

  created_at: number;

  datatype: string;

  landing_page_id: string;

  partition_key: string;

  product_group_id: string;

  product_id: string;

  runs_until?: number;

  sort_key: string;

  starts_on?: number;
}
