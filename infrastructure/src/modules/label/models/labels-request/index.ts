/* ---------- External ---------- */
interface LabelsRequestInterface {
  format: string;
  status: string;
  sort_key: string;
  datatype: string;
  brand_id: string;
  gtin: string;
  created_at: number;
  created_by: string;
  reference?: string;
  partition_key: string;
  labels_amount: number;
  batches_info: Record<string, boolean>;
}

export class LabelsRequest implements LabelsRequestInterface {
  format: string;

  status: string;

  sort_key: string;

  datatype: string;

  brand_id: string;

  gtin: string;

  created_at: number;

  created_by: string;

  reference?: string;

  partition_key: string;

  labels_amount: number;

  batches_info: Record<string, boolean>;
}
