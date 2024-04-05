/* ---------- Modules ---------- */
import { get_all_polytag_brand_users } from '_modules/users/functions/get/get-all-polytag-brand-users';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const { users, last_evaluated_key } = await get_all_polytag_brand_users({
      brand_id: event.brand_id,
      last_key: event.product_last_evaluated_key,
    });

    const client: Clients = {
      ...event,
      user_last_evaluated_key: last_evaluated_key,
      users_count: event.users_count + users.length,
    };

    return { client, all_users_fetch: !last_evaluated_key };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
