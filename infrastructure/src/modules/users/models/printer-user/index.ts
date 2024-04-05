interface PrinterUserInterface {
  created_at: number;
  datatype: string;
  email: string;
  last_login: number;
  partition_key: string;
  sort_key: string;
  updated_at: number;
  created_by: string;
}

export class PrinterUser implements PrinterUserInterface {
  created_at: number;

  datatype: string;

  email: string;

  last_login: number;

  partition_key: string;

  sort_key: string;

  updated_at: number;

  created_by: string;
}
