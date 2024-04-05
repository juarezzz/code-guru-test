/* ---------- Modules ---------- */
import { get_all_brands } from '_modules/brands/functions/get/get-all-brands';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const { brands, last_evaluated_key } = await get_all_brands({
      last_key: event.client_last_evaluated_key,
    });

    const clients: Clients[] = brands.map(brand => ({
      brand_id: brand.partition_key.replace('brand#', ''),
      client_last_evaluated_key: last_evaluated_key,
      live_campaigns_count: 0,
      live_campaigns_last_evaluated_key: undefined,
      product_last_evaluated_key: undefined,
      products_count: 0,
      qrs_printed_count: 0,
      qrs_printed_db_count: 0,
      qrs_printed_last_evaluated_key: undefined,
      qrs_printed_db_last_evaluated_key: undefined,
      total_reach_count: 0,
      total_reach_last_evaluated_key: undefined,
      user_last_evaluated_key: undefined,
      users_count: 0,
    }));

    return { status: 200, clients };
  } catch (error) {
    console.error(error);

    return { error: 'error', status: 500 };
  }
};
