/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Types ---------- */
export interface GetRecentActivities {
  brand_id: string;
}

export interface GetRecentActivitiesOutput {
  campaign_id: string;
  time: number;
  city: string;
}

/* ---------- Function ---------- */
const get_recent_activities = async ({ brand_id }: GetRecentActivities) => {
  const recent_activities: GetRecentActivitiesOutput[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;

  const query_string = `
    SELECT
      DISTINCT(request_id),
      COALESCE(campaign_id, 'no-campaign'),
      TO_MILLISECONDS(time), city
    FROM ${table}
    WHERE
      measure_name = 'landing-page-scan'
      AND city != 'null'
      AND brand_id = '${brand_id}'
    ORDER BY TO_MILLISECONDS(time) DESC
    LIMIT 5
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows } = await timestream_client_query.send(command);

    if (!Rows) return { recent_activities };

    Rows.forEach(row => {
      if (row.Data) {
        const [
          _,
          { ScalarValue: campaign_id },
          { ScalarValue: time },
          { ScalarValue: city },
        ] = row.Data;

        if (!campaign_id || !time || !city) return;

        recent_activities.push({
          campaign_id,
          time: Number(time),
          city: decodeURIComponent(city),
        });
      }
    });
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { recent_activities };
    }

    throw new Error(error_message);
  }

  return { recent_activities };
};

/* ---------- Export ---------- */
export { get_recent_activities };
