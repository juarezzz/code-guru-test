/* ---------- External ---------- */
interface ThirdParties {
  third_party_id: string;
  redeemed_at: number;
  confirmed_at: number;
  status: string;
}

interface LabelInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  printed: boolean;
  timetolive: number;
  created_at: number;
  created_by: string;
  request_id?: string;

  third_parties: ThirdParties[];
}

export class Label implements LabelInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  printed: boolean;

  timetolive: number;

  created_at: number;

  created_by: string;

  request_id?: string;

  third_parties: ThirdParties[];
}
