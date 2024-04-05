/* ---------- External ---------- */
import {
  QueryCommand,
  QueryCommandInput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Types ---------- */
interface GetScansByLocation {
  next_token?: string;
  range: string;
  gtins: string[];
  product_groups: string[];
  brand_id: string;
}

export interface GetScansByLocationResponse {
  latitude: string;
  longitude: string;
  scans_count: number;
  city: string;
  state: string | null;
  country: string;
}

/* ---------- Function ---------- */
const get_scans_by_location = async ({
  gtins,
  product_groups,
  range,
  brand_id,
  next_token,
}: GetScansByLocation) => {
  const scans_by_location: GetScansByLocationResponse[] = [];

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;
  const gtins_in = `AND gtin IN (${gtins.map(gtin => `'${gtin}'`).join(', ')})`;
  const product_groups_in = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const query_string = `
    SELECT
      country_region_name,
      country_name,
      city,
      AVG(CAST(longitude AS DOUBLE)) as longitude,
      AVG(CAST(latitude AS DOUBLE)) as latitude,
      COUNT(*) as count
    FROM ${table}
    WHERE measure_name = 'landing-page-scan'
      AND brand_id = '${brand_id}'
      AND 'null' NOT IN (latitude, longitude, city)
      AND ${range}
      ${gtins.length > 0 ? gtins_in : ''}
      ${product_groups.length > 0 ? product_groups_in : ''}
    GROUP BY country_region_name, country_name, city
  `;

  const params: QueryCommandInput = {
    QueryString: query_string,
    NextToken: next_token,
  };

  const command = new QueryCommand(params);

  try {
    const { Rows, NextToken } = await timestream_client_query.send(command);

    if (!Rows) return { scans_by_location };

    Rows.forEach(row => {
      if (row.Data) {
        const [
          { ScalarValue: state },
          { ScalarValue: country },
          { ScalarValue: city },
          { ScalarValue: longitude },
          { ScalarValue: latitude },
          { ScalarValue: count },
        ] = row.Data;

        if (!country || !city || !longitude || !latitude || !count) return;

        scans_by_location.push({
          city: decodeURIComponent(city),
          latitude,
          longitude,
          scans_count: Number(count) || 0,
          state: !state || state === 'not-set' ? null : state,
          country,
        });
      }
    });

    if (NextToken) {
      const { scans_by_location: scans_by_location_extra } =
        await get_scans_by_location({
          gtins,
          range,
          next_token: NextToken,
          brand_id,
          product_groups,
        });

      scans_by_location_extra.forEach(scan => {
        const location_index = scans_by_location.findIndex(
          l =>
            l.city === scan.city &&
            l.country === scan.country &&
            l.state === scan.state,
        );

        if (location_index !== -1) {
          scans_by_location.push(scan);
        } else {
          scans_by_location[location_index].scans_count += scan.scans_count;
        }
      });
    }
  } catch (error) {
    const { message: error_message } = error as TimestreamQueryServiceException;

    if (error_message.endsWith('does not exist')) {
      return { scans_by_location };
    }

    throw new Error(error_message);
  }

  return { scans_by_location };
};

/* ---------- Export ---------- */
export { get_scans_by_location };
