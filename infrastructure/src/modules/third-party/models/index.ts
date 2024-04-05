/* ---------- External ---------- */
interface ThirdPartyInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  partition_key: string;
  search: string;
  sort_key: string;
  third_party_name: string;
  updated_at: number;
}

export class ThirdParty implements ThirdPartyInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  partition_key: string;

  search: string;

  sort_key: string;

  third_party_name: string;

  updated_at: number;
}
