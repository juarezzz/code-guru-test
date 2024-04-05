/* ---------- Types ---------- */
import { Build } from '__build/@types';

/* ---------- Interfaces ---------- */
export interface ValidateGTINInput {
  gtin: string;
  environment: Build.Environment;
}
