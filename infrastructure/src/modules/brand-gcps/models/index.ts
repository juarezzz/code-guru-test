/* ---------- External ---------- */
interface BrandGCPInterface {
  created_at: number;
  gcp: string;
  datatype: string;
  partition_key: string;
  sort_key: string;
}

export class BrandGCP implements BrandGCPInterface {
  created_at: number;

  gcp: string;

  datatype: string;

  partition_key: string;

  sort_key: string;
}
