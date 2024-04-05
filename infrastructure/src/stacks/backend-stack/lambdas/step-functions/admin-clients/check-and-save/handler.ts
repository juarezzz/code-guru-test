/* ---------- Modules ---------- */
import { update_brand } from '_modules/brands/functions/update/update-brand';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

export const handler = async (event: Clients) => {
  try {
    await update_brand({
      brand_id: event.brand_id,
      products_count: event.products_count,
      users_count: event.users_count,
      live_campaigns_count: event.live_campaigns_count,
      total_reach_count: event.total_reach_count,
      qrs_printed_count: event.qrs_printed_count,
      qrs_printed_db_count: event.qrs_printed_db_count,
    });

    return {
      all_clients_fetch: !event.client_last_evaluated_key,
      client_last_evaluated_key: event.client_last_evaluated_key,
    };
  } catch (error) {
    console.error(error);

    throw new Error();
  }
};
