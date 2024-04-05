/* ---------- External ---------- */
import { format, subDays } from 'date-fns';

/* ---------- Modules ---------- */
import { get_all_products } from '_modules/products/functions/get/get-all-products';

/* ---------- Helpers ---------- */
import { date_range_sql } from '_helpers/analytics/date-range-sql';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Modues ---------- */
import { get_labels_printed } from '_modules/analytics/functions/get/get-labels-printed';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const gtin_array: string[] = [];
    let total = 0;

    const { products, last_evaluated_key } = await get_all_products({
      brand_id: event.brand_id,
      last_key: event.product_last_evaluated_key,
    });

    products.forEach(product => gtin_array.push(product.gtin));

    const today = format(new Date(), 'yyyy-MM-dd');
    const past_year = format(subDays(new Date(), 365), 'yyyy-MM-dd');

    const range_sql = date_range_sql(past_year, today);

    const { labels_printed } = await get_labels_printed({
      gtins: gtin_array,
      range: range_sql,
    });

    labels_printed.forEach(d => {
      total += d.count;
    });

    const client: Clients = {
      ...event,
      qrs_printed_count: event.qrs_printed_count + total,
      qrs_printed_last_evaluated_key: last_evaluated_key,
    };

    return { client, all_qrs_printed_fetch: !last_evaluated_key };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
