/* ---------- External ---------- */
interface ProductComponentsInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  partition_key: string;
  sort_key: string;
  updated_at: number;
  components: { name: string; id: string }[];
  updated_by: string;
}

export class ProductComponents implements ProductComponentsInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  sort_key: string;

  updated_at: number;

  components: { name: string; id: string }[];

  updated_by: string;
}
