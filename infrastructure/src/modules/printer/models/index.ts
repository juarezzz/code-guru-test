/* ---------- External ---------- */
interface PrinterInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  partition_key: string;
  search: string;
  sort_key: string;
  printer_name: string;
  updated_at: number;
}

export class Printer implements PrinterInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  search: string;

  sort_key: string;

  printer_name: string;

  updated_at: number;
}
