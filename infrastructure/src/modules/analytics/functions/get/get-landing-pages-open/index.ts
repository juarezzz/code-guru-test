/* ---------- External ---------- */
import {
  isAfter,
  addMinutes,
  startOfWeek,
  startOfMonth,
  differenceInDays,
  eachDayOfInterval,
  eachHourOfInterval,
} from 'date-fns';
import {
  QueryCommand,
  QueryCommandInput,
  QueryCommandOutput,
  TimestreamQueryServiceException,
} from '@aws-sdk/client-timestream-query';
import { formatInTimeZone } from 'date-fns-tz';

/* ---------- Helpers ---------- */
import { get_bucket } from '_helpers/analytics/get-bucket';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { apply_timezone_offset } from '_helpers/analytics/date/apply-timezone-offset';

/* ---------- Types ---------- */
import { GetISOTimestampOffsetOutput } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Interfaces ---------- */
export interface Open {
  key: string;
  value: number;
}

type LandingPagesOpen = Record<string, Open[]>;

export type LandingPagesOpenViews = 'campaign' | 'product' | 'product-group';

interface GetLandingPagesOpenInput {
  gtins: string[];
  end_date: Date;
  brand_id: string;
  start_date: Date;
  product_groups: string[];
  view: LandingPagesOpenViews;
  timestamp_offset: GetISOTimestampOffsetOutput;
}

interface GetLandingPagesOpenOutput {
  bucket: string;
  landing_pages_open: LandingPagesOpen;
}

/* ---------- Constants ---------- */
const GROUP_KEYS: Record<
  LandingPagesOpenViews,
  { key: string; coalesce: string }
> = {
  product: { key: 'gtin', coalesce: 'no-gtin' },
  campaign: { key: 'campaign_id', coalesce: 'no-campaign' },
  'product-group': { key: 'product_group_id', coalesce: 'no-product-group' },
};

/* ---------- Function ---------- */
const get_landing_pages_open = async ({
  view,
  gtins,
  end_date,
  brand_id,
  start_date,
  product_groups,
  timestamp_offset,
}: GetLandingPagesOpenInput): Promise<GetLandingPagesOpenOutput> => {
  /* ----------
   * Preparing filters and arguments for the query
   * ---------- */

  const landing_pages_open: LandingPagesOpen = {};

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;

  const sql_date_filter = date_range_sql(start_date, end_date);

  const difference_in_days = differenceInDays(end_date, start_date);

  const bucket = get_bucket({ time_range: difference_in_days });

  const gtins_filter = `AND gtin IN (${gtins
    .map(gtin => `'${gtin}'`)
    .join(', ')})`;

  const product_groups_filter = `AND product_group_id IN (${product_groups
    .map(
      product_group => `'${product_group.replace('brand-product-group#', '')}'`,
    )
    .join(', ')})`;

  const view_group_key = GROUP_KEYS[view];

  let query_string = '';

  /* ----------
   * Generating the overtime object and the query itself
   * ---------- */

  switch (bucket) {
    case 'hourly': {
      const date_range = eachHourOfInterval({
        start: start_date,
        end: end_date,
      });

      date_range.forEach(date => {
        const date_key = formatInTimeZone(
          date,
          'UTC',
          "yyyy-MM-dd'T'HH':00:00Z'",
        );

        landing_pages_open[date_key] = [];
      });

      query_string = `
        SELECT
          date_format(time, '%Y-%m-%dT%H:00:00Z') as date,
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}') as key,
          COUNT(*) as count
        FROM ${table}
        WHERE measure_name = 'landing-page-scan'
        AND brand_id = '${brand_id}'
        ${gtins.length ? gtins_filter : ''}
        ${product_groups.length ? product_groups_filter : ''}
        AND ${sql_date_filter}
        GROUP BY
          date_format(time, '%Y-%m-%dT%H:00:00Z'),
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}')
      `;

      break;
    }

    case 'daily': {
      let date_range = eachDayOfInterval({
        end: end_date,
        start: start_date,
      });

      /* If the user's timezone is ahead UTC and the local timezone is behind
       * UTC, remove the first date, as it will be generated a day earlier */
      if (
        date_range[0]?.getTimezoneOffset() >= 0 &&
        timestamp_offset.offset_in_minutes > 0
      ) {
        date_range = date_range.slice(1);
      }

      date_range.forEach(date => {
        const utc_date = apply_timezone_offset({
          date,
          offset_in_minutes: timestamp_offset.offset_in_minutes,
        });

        if (isAfter(utc_date, end_date)) return;

        const date_key = formatInTimeZone(
          utc_date,
          'UTC',
          "yyyy-MM-dd'T'HH':00:00Z'",
        );

        landing_pages_open[date_key] = [];
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('day', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date,
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}') as key,
          COUNT(*) as count
        FROM ${table}
        WHERE measure_name = 'landing-page-scan'
        AND brand_id = '${brand_id}'
        ${gtins.length ? gtins_filter : ''}
        ${product_groups.length ? product_groups_filter : ''}
        AND ${sql_date_filter}
        GROUP BY
          ${date_format_exp},
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}')
        ORDER BY date ASC
      `;

      break;
    }

    case 'weekly': {
      const initial_date = apply_timezone_offset({
        date: startOfWeek(start_date, {
          weekStartsOn: 1,
        }),
        offset_in_minutes: timestamp_offset.offset_in_minutes,
      });

      const initial_date_key = formatInTimeZone(
        initial_date,
        'UTC',
        "yyyy-MM-dd'T'HH':00:00Z'",
      );

      landing_pages_open[initial_date_key] = [];

      let date_range = eachDayOfInterval({
        start: start_date,
        end: end_date,
      });

      /* If the user's timezone is ahead UTC and the local timezone is behind
       * UTC, remove the first date, as it will be generated a day earlier */
      if (
        date_range[0]?.getTimezoneOffset() >= 0 &&
        timestamp_offset.offset_in_minutes > 0
      ) {
        date_range = date_range.slice(1);
      }

      date_range.forEach(date => {
        const utc_date = apply_timezone_offset({
          date,
          offset_in_minutes: timestamp_offset.offset_in_minutes,
        });

        const is_start_of_week =
          addMinutes(
            utc_date,
            timestamp_offset.offset_in_minutes,
          ).getUTCDay() === 1;

        if (is_start_of_week && !isAfter(utc_date, end_date)) {
          const date_key = formatInTimeZone(
            utc_date,
            'UTC',
            "yyyy-MM-dd'T'HH':00:00Z'",
          );

          landing_pages_open[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('week', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date,
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}') as key,
          COUNT(*) as count
        FROM ${table}
        WHERE measure_name = 'landing-page-scan'
        AND brand_id = '${brand_id}'
        ${gtins.length ? gtins_filter : ''}
        ${product_groups.length ? product_groups_filter : ''}
        AND ${sql_date_filter}
        GROUP BY
          ${date_format_exp},
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}')
        ORDER BY date ASC
      `;

      break;
    }

    case 'monthly': {
      const initial_date = apply_timezone_offset({
        date: startOfMonth(start_date),
        offset_in_minutes: timestamp_offset.offset_in_minutes,
      });

      const initial_date_key = formatInTimeZone(
        initial_date,
        'UTC',
        "yyyy-MM-dd'T'HH':00:00Z'",
      );

      landing_pages_open[initial_date_key] = [];

      let date_range = eachDayOfInterval({
        start: start_date,
        end: end_date,
      });

      /* If the user's timezone is ahead UTC and the local timezone is behind
       * UTC, remove the first date, as it will be generated a day earlier */
      if (
        date_range[0]?.getTimezoneOffset() >= 0 &&
        timestamp_offset.offset_in_minutes > 0
      ) {
        date_range = date_range.slice(1);
      }

      date_range.forEach(date => {
        const utc_date = apply_timezone_offset({
          date,
          offset_in_minutes: timestamp_offset.offset_in_minutes,
        });

        const is_start_of_month =
          addMinutes(
            utc_date,
            timestamp_offset.offset_in_minutes,
          ).getUTCDate() === 1;

        if (is_start_of_month && !isAfter(utc_date, end_date)) {
          const date_key = formatInTimeZone(
            utc_date,
            'UTC',
            "yyyy-MM-dd'T'HH':00:00Z'",
          );

          landing_pages_open[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('month', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date,
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}') as key,
          COUNT(*) as count
        FROM ${table}
        WHERE measure_name = 'landing-page-scan'
        AND brand_id = '${brand_id}'
        ${gtins.length ? gtins_filter : ''}
        ${product_groups.length ? product_groups_filter : ''}
        AND ${sql_date_filter}
        GROUP BY
          ${date_format_exp},
          COALESCE(${view_group_key.key}, '${view_group_key.coalesce}')
        ORDER BY date ASC
      `;

      break;
    }

    default:
      break;
  }

  /* ----------
   * Querying timestream
   * ---------- */

  const params: QueryCommandInput = {
    QueryString: query_string,
  };

  let next_token: QueryCommandOutput['NextToken'] | undefined;

  do {
    params.NextToken = next_token;

    const command = new QueryCommand(params);

    try {
      const { Rows, NextToken } = await timestream_client_query.send(command);

      Rows?.forEach(row => {
        if (!row.Data) return;

        const [
          { ScalarValue: date },
          { ScalarValue: key },
          { ScalarValue: count },
        ] = row.Data;

        if (!key || !date || !count) return;

        const key_index = landing_pages_open[date]?.findIndex(
          date_item => date_item.key === key,
        );

        if (key_index && key_index !== -1) {
          landing_pages_open[date][key_index].value += Number(count);
        } else {
          if (!landing_pages_open[date]?.length) landing_pages_open[date] = [];

          landing_pages_open[date]?.push({
            key,
            value: Number(count),
          });
        }
      });

      next_token = NextToken;
    } catch (error) {
      const { message: error_message } =
        error as TimestreamQueryServiceException;

      if (error_message.endsWith('does not exist')) {
        return { landing_pages_open, bucket };
      }

      throw new Error(error_message);
    }
  } while (next_token);

  /* ----------
   * Padding the results with zeroes
   * ---------- */

  const all_keys_list = Array.from(
    Object.values(landing_pages_open).reduce((result: Set<string>, current) => {
      current.forEach(({ key }) => result.add(key));

      return result;
    }, new Set<string>()),
  );

  for (const date in landing_pages_open) {
    if (Object.prototype.hasOwnProperty.call(landing_pages_open, date)) {
      const scans = landing_pages_open[date];

      all_keys_list.forEach(key => {
        if (scans.find(scan => scan.key === key)) return;

        landing_pages_open[date].push({
          key,
          value: 0,
        });
      });
    }
  }

  return { landing_pages_open, bucket };
};

/* ---------- Export ---------- */
export { get_landing_pages_open };
