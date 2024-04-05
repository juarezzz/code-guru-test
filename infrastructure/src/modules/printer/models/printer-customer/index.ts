/* ---------- External ---------- */
interface PrinterCustomerInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  created_at: number;
  updated_at: number;
  brand_name: string;
}

export class PrinterCustomer implements PrinterCustomerInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  created_at: number;

  updated_at: number;

  brand_name: string;
}
