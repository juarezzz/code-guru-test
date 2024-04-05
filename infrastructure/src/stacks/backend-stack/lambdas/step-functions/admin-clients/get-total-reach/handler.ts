/* ---------- External ---------- */
import { format, subDays } from 'date-fns';

/* ---------- Modules ---------- */
import { get_scans } from '_modules/analytics/functions/get/get-scans';

/* ---------- Helpers ---------- */
import { date_range_sql } from '_helpers/analytics/date-range-sql';

/* ---------- Types ---------- */
import { Clients } from '_stacks/backend-stack/lambdas/step-functions/admin-clients/@types';

/* ---------- Interfaces ---------- */
type Event = Clients;

export const handler = async (event: Event) => {
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    const past_thirty_days = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const range_sql = date_range_sql(past_thirty_days, today);

    const { scans } = await get_scans({
      range: range_sql,
      brand_id: event.brand_id,
    });

    const client: Clients = {
      ...event,
      total_reach_count: event.total_reach_count + scans,
    };

    return { client, all_total_reach_fetch: true };
  } catch (error) {
    console.log(error);

    throw new Error();
  }
};
