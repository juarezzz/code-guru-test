interface ThirdPartyUserInviteInterface {
  partition_key: string;
  sort_key: string;
  email: string;
  datatype: string;
  created_by: string;
  created_at: number;
  updated_at: number;
  third_party_id: string;
  third_party_groups: string[];
}

export class ThirdPartyUserInvite implements ThirdPartyUserInviteInterface {
  partition_key: string;

  sort_key: string;

  email: string;

  datatype: string;

  created_by: string;

  created_at: number;

  updated_at: number;

  third_party_id: string;

  third_party_groups: string[];
}
