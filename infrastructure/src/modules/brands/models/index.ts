/* ---------- External ---------- */
interface BrandInterface {
  brand_name: string;
  created_at: number;
  created_by: string;
  datatype: string;
  gcp_list?: Set<string>;
  gs1_territory: string;
  industry: string;
  logo_url: string;
  organisation_size: string;
  partition_key: string;
  search: string;
  sort_key: string;
  updated_at: number;
  products_count: number;
}

export class Brand implements BrandInterface {
  brand_name: string;

  created_at: number;

  created_by: string;

  datatype: string;

  gcp_list?: Set<string>;

  gs1_territory: string;

  industry: string;

  logo_url: string;

  organisation_size: string;

  partition_key: string;

  search: string;

  sort_key: string;

  updated_at: number;

  products_count: number;

  landing_pages_count: number;

  campaigns_count: number;

  product_group_count: number;
}
