interface AdminInterface {
  partition_key: string;
  sort_key: string;
  email: string;
  cognito_group: string;
  datatype: string;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export class AdminInvite implements AdminInterface {
  partition_key: string;

  sort_key: string;

  email: string;

  cognito_group: string;

  datatype: string;

  created_by: string;

  created_at: number;

  updated_at: number;
}
