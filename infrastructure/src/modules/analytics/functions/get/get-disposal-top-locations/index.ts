/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';
import { find_country_city } from '_helpers/general/find-country-city';

/* ---------- Interfaces ---------- */
interface GetDisposalTopLocationsInput {
  range: string;
  gtins: string[];
}

interface TopLocation {
  city: string;
  count: number;
}

/* ---------- Function ---------- */
const get_disposal_top_locations = async ({
  range,
  gtins,
}: GetDisposalTopLocationsInput) => {
  const location_to_count: Record<string, number> = {};

  if (!gtins.length) return [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = gtins.map(gtin => String(Number(gtin))).join(', ');

  const query_string = `
    SELECT
      SUM(measure_value::bigint) AS count,
      CONCAT(
        'CITY=', city,
        ',COUNTRY_CODE=', country_code,
        ',COUNTRY=', country
      ) as location
    FROM ${table}
    WHERE measure_name = 'third_party_measure'
    AND data_type = 'third_party_redeem'
    AND CAST(gtin AS bigint) IN (${gtins_in})
    AND ${range}
    GROUP BY CONCAT(
      'CITY=', city,
      ',COUNTRY_CODE=', country_code,
      ',COUNTRY=', country
    )
    ORDER BY count DESC
  `;

  try {
    const params: QueryCommandInput = {
      QueryString: query_string,
    };

    let next_token: string | undefined;

    do {
      params.NextToken = next_token;

      const command = new QueryCommand(params);

      const { Rows, NextToken } = await timestream_client_query.send(command);

      if (!Rows) {
        next_token = undefined;
        break;
      }

      Rows.forEach(row => {
        if (row.Data) {
          const [{ ScalarValue: count }, { ScalarValue: location }] = row.Data;

          if (!count) return;

          let new_city: string | undefined;

          if (location) {
            const city = location.split('CITY=')[1].split(',COUNTRY_CODE=')[0];
            const country = location.split(',COUNTRY=')[1];

            const country_code = location
              .split(',COUNTRY_CODE=')[1]
              .split(',COUNTRY=')[0];

            new_city =
              city && city.length && city !== 'not-set'
                ? city
                : find_country_city({ country, country_code })?.city;
          }

          const location_name = new_city || 'Unknown';

          if (!location_to_count[location_name]) {
            location_to_count[location_name] = Number(count);
          } else {
            location_to_count[location_name] += Number(count);
          }
        }
      });

      next_token = NextToken;
    } while (next_token);
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return [];
    }

    throw new Error(error_message);
  }

  const top_locations: TopLocation[] = Object.entries(location_to_count)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return top_locations;
};

/* ---------- Export ---------- */
export { get_disposal_top_locations };
