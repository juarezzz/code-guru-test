/* ---------- Interfaces ---------- */
interface MrfInterface {
  created_at: number;
  created_by: string;
  datatype: string;
  mrf_name: string;
  partition_key: string;
  sort_key: string;
  updated_at: number;
  location: {
    latitude: number;
    longitude: number;
  };
}

export class Mrf implements MrfInterface {
  created_at: number;

  created_by: string;

  datatype: string;

  mrf_name: string;

  partition_key: string;

  sort_key: string;

  updated_at: number;

  location: {
    latitude: number;
    longitude: number;
  };
}
