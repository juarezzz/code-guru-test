interface MRFUserInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  email: string;
  last_login: number;
  created_at: number;
  updated_at: number;
  role: string;
  status: string;
  filter: string;
}

export class MRFUser implements MRFUserInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  email: string;

  last_login: number;

  created_at: number;

  updated_at: number;

  role: string;

  status: string;

  filter: string;
}
