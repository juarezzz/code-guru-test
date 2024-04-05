/* ---------- Models ---------- */
import { Campaign } from '_modules/campaigns/models';

/* ---------- Interfaces ---------- */
interface CampaignsSnapshotInterface {
  partition_key: string;
  sort_key: string;
  created_at: number;
  campaigns_data: { brand_name: string; campaigns: Campaign[] }[];
}

export class CampaignsSnapshot implements CampaignsSnapshotInterface {
  partition_key: string;

  sort_key: string;

  created_at: number;

  campaigns_data: { brand_name: string; campaigns: Campaign[] }[];
}
