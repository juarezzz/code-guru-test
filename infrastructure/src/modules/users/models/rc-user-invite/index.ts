interface RCUserInviteInterface {
  partition_key: string;
  sort_key: string;
  email: string;
  datatype: string;
  created_by: string;
  created_at: number;
  updated_at: number;
  mrf_id: string;
  role: string;
  filter: string;
}

export class RCUserInvite implements RCUserInviteInterface {
  partition_key: string;

  sort_key: string;

  email: string;

  datatype: string;

  created_by: string;

  created_at: number;

  updated_at: number;

  mrf_id: string;

  role: string;

  filter: string;
}
