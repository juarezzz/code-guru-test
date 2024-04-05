interface ProductGroupInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;

  product_group_name: string;
  products_count: number;

  owner_name: string;

  assigned_campaign_name?: string;
  assigned_campaign_sort_key?: string;

  created_by: string;
  created_at: number;
  updated_at: number;

  search: string;
}

export class ProductGroup implements ProductGroupInterface {
  assigned_campaign_name?: string;

  assigned_campaign_sort_key?: string;

  created_at: number;

  created_by: string;

  datatype: string;

  owner_name: string;

  owner_sub: string;

  partition_key: string;

  product_group_name: string;

  products_count: number;

  search: string;

  sort_key: string;

  updated_at: number;
}
