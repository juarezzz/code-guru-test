/* ---------- Models ---------- */
import { DisplayPage } from '_modules/display-page/models';

/* ---------- Interfaces ---------- */
export interface GenerateQRPrintsInput {
  product_details: DisplayPage;
  amount: number;
  start_date: Date;
  end_date: Date;
}
