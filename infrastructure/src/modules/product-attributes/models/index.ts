/* ---------- External ---------- */
interface ProductAttributesInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  partition_key: string;
  sort_key: string;
  updated_at: number;
  attributes: { name: string; id: string }[];
  updated_by: string;
}

export class ProductAttributes implements ProductAttributesInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  sort_key: string;

  updated_at: number;

  attributes: { name: string; id: string }[];

  updated_by: string;
}
