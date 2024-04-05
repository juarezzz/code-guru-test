export interface Clients {
  brand_id: string;
  client_last_evaluated_key?: string;
  live_campaigns_count: number;
  live_campaigns_last_evaluated_key?: string;
  product_last_evaluated_key?: string;
  products_count: number;
  qrs_printed_count: number;
  qrs_printed_db_count: number;
  qrs_printed_last_evaluated_key?: string;
  qrs_printed_db_last_evaluated_key?: Record<string, unknown>;
  total_reach_count: number;
  total_reach_last_evaluated_key?: Record<string, unknown>;
  user_last_evaluated_key?: string;
  users_count: number;
}
