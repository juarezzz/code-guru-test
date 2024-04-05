/* ---------- Modules ---------- */
import { get_all_labels } from '_modules/label/functions/get/get-all-labels';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const { labels, last_evaluated_key } = await get_all_labels({
      brand_id: event.brand_id,
      last_key: event.qrs_printed_db_last_evaluated_key,
    });

    let count = 0;

    labels.forEach(label => {
      if (label.printed) count += 1;
    });

    const client: Clients = {
      ...event,
      qrs_printed_db_last_evaluated_key: last_evaluated_key,
      qrs_printed_db_count: event.qrs_printed_db_count + count,
    };

    return { client, all_qrs_printed_db_fetch: !last_evaluated_key };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
