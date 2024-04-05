/* ---------- Interfaces ---------- */
export interface ValuesRanges {
  qr_prints_range: number[];
  qr_scans_range: number[];
  uv_scans_range: number[];
}

export interface MonthlySetting {
  [gtin: string]: ValuesRanges;
}

interface PopulateCronSettingsInterface {
  partition_key: string;
  sort_key: string;
  datatype: string;
  enabled: boolean;
  monthly_values: { [month: string]: MonthlySetting };
  mrf_id?: string;
}

export class PopulateCronSettings implements PopulateCronSettingsInterface {
  partition_key: string;

  sort_key: string;

  datatype: string;

  enabled: boolean;

  monthly_values: { [month: string]: MonthlySetting };

  mrf_id: string;
}
