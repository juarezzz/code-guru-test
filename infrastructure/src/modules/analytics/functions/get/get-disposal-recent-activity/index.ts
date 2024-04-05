/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Helpers ---------- */
import { find_country_city } from '_helpers/general/find-country-city';

/* ---------- Interfaces ---------- */
interface GetDisposalRecentActivityInput {
  gtins: string[];
}

interface DisposalActivity {
  time: number;
  type: string;
  city?: string;
  third_party_id: string;
}

/* ---------- Function ---------- */
const get_disposal_recent_activity = async ({
  gtins,
}: GetDisposalRecentActivityInput) => {
  const activities: DisposalActivity[] = [];

  if (!gtins.length) return activities;

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = gtins.map(gtin => String(Number(gtin))).join(', ');

  const query_string = `
    SELECT
      third_party_id, to_milliseconds(time),
      data_type, city, country_code, country
    FROM ${table}
    WHERE measure_name = 'third_party_measure'
    AND (
      data_type = 'third_party_redeem' OR
      data_type = 'third_party_pre_redeem'
    )
    AND CAST(gtin AS bigint) IN (${gtins_in})
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
      if (row.Data) {
        const [
          { ScalarValue: third_party_id },
          { ScalarValue: time },
          { ScalarValue: type },
          { ScalarValue: city },
          { ScalarValue: country_code },
          { ScalarValue: country },
        ] = row.Data;

        if (!third_party_id || !time || !type) return;

        const new_city =
          city && city !== 'not-set'
            ? city
            : find_country_city({ country, country_code })?.city;

        activities.push({
          type,
          third_party_id,
          city: new_city,
          time: Number(time),
        });
      }
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
export { get_disposal_recent_activity };
