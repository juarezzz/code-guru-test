/* ---------- External ---------- */
import { Components, Attributes } from '_modules/products/models';

/* ---------- Interfaces ---------- */
export interface ProductInput {
  attributes: Attributes[];
  components: Components[];
  gtin: string;
  product_description: string;
  product_group_name?: string;
  product_name: string;
}

export interface CreateProductInput {
  product_input: ProductInput;
  brand_id: string;
  created_by: string;
  product_group_sort_key?: string;
}
