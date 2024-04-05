interface AdminUserInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  created_at: number;
  updated_at: number;
  cognito_group: string;
  last_login: number;
  email: string;
}

export class AdminUser implements AdminUserInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  created_at: number;

  updated_at: number;

  cognito_group: string;

  last_login: number;

  email: string;
}
