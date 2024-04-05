/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const { products, last_evaluated_key } = await get_all_products({
      brand_id: event.brand_id,
      last_key: event.product_last_evaluated_key,
    });

    const client: Clients = {
      ...event,
      product_last_evaluated_key: last_evaluated_key,
      products_count: event.products_count + products.length,
    };

    return { client, all_products_fetch: !last_evaluated_key };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
