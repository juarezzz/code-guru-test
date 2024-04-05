interface PrinterUserInviteInterface {
  partition_key: string;
  sort_key: string;
  email: string;
  datatype: string;
  created_by: string;
  created_at: number;
  updated_at: number;
  printer_id: string;
}

export class PrinterUserInvite implements PrinterUserInviteInterface {
  partition_key: string;

  sort_key: string;

  email: string;

  datatype: string;

  created_by: string;

  created_at: number;

  updated_at: number;

  printer_id: string;
}
