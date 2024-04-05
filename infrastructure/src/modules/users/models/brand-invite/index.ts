interface BrandUserInviteInterface {
  partition_key: string;
  sort_key: string;
  created_at: number;
  created_by: string;
  datatype: string;
  email: string;
  filter: string;
  roles: string[];
}

export class BrandUserInvite implements BrandUserInviteInterface {
  partition_key: string;

  sort_key: string;

  created_at: number;

  created_by: string;

  datatype: string;

  email: string;

  filter: string;

  roles: string[];
}
