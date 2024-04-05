/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
export interface GenerateQRScansInput {
  product_details: DisplayPage;
  amount: number;
  start_date: Date;
  end_date: Date;
}

export interface PingData {
  data_type: string;
  measure_name: string;
  time: string;
  'measure_value::varchar': string;
}
