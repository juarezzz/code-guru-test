/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
interface GetSustainabilityRecentActivityInput {
  gtins: string[];
}

interface SustainabilityActivity {
  time: number;
  gtin: string;
  count: number;
  mrf_id: string;
}

/* ---------- Function ---------- */
const get_sustainability_recent_activity = async ({
  gtins,
}: GetSustainabilityRecentActivityInput) => {
  const activities: SustainabilityActivity[] = [];

  if (!gtins.length) return activities;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;

  const gtins_filter = `AND gtin IN (${gtins
    .map(gtin => `'${gtin}'`)
    .join(', ')})`;

  const query_string = `
    SELECT
      mrf_id, to_milliseconds(time),
      gtin, measure_value::bigint
    FROM ${table}
    WHERE measure_name = 'uv-scans'
    ${gtins_filter}
    ORDER BY time DESC
    LIMIT 5
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows } = await timestream_client_query.send(command);

    if (!Rows) return [];

    Rows.forEach(row => {
      if (!row.Data) return;

      const [
        { ScalarValue: mrf_id },
        { ScalarValue: time },
        { ScalarValue: gtin },
        { ScalarValue: count },
      ] = row.Data;

      if (!mrf_id || !time || !gtin || !count) return;

      activities.push({
        gtin,
        mrf_id,
        time: Number(time),
        count: Number(count),
      });
    });
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return activities;
    }

    throw new Error(error_message);
  }

  return activities;
};

/* ---------- Export ---------- */
export { get_sustainability_recent_activity };
