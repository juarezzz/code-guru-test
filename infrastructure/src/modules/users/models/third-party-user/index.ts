interface ThirdPartyUserInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  email: string;
  last_login: number;
  partition_key: string;
  sort_key: string;
  updated_at: number;
  third_party_groups: string[];
}

export class ThirdPartyUser implements ThirdPartyUserInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  email: string;

  last_login: number;

  partition_key: string;

  sort_key: string;

  updated_at: number;

  third_party_groups: string[];
}
