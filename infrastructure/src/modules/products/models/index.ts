/* ---------- Interfaces ---------- */
export interface Attributes {
  id: string;
  name: string;
  value: string;
}

export interface Components {
  id: string;
  material: string;
  name: string;
  percentage: number;
  weight: number;
}

interface ProductInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;

  product_name: string;
  product_description: string;
  product_group_name?: string;
  product_group_sort_key?: string;

  gtin: string;
  components: Components[];
  attributes: Attributes[];

  information_url?: string;
  image_url?: string;

  created_at: number;
  created_by: string;
  updated_at: number;
  search: string;
}

export class Product implements ProductInterface {
  attributes: Attributes[];

  components: Components[];

  created_at: number;

  created_by: string;

  datatype: string;

  gtin: string;

  partition_key: string;

  product_description: string;

  product_group_name?: string;

  product_group_sort_key?: string;

  product_name: string;

  search: string;

  sort_key: string;

  updated_at: number;

  information_url?: string;

  image_url?: string;
}
