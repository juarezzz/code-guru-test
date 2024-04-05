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

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Helpers ---------- */
import { get_bucket } from '_helpers/analytics/get-bucket';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { apply_timezone_offset } from '_helpers/analytics/date/apply-timezone-offset';

/* ---------- Types ---------- */
import { GetISOTimestampOffsetOutput } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Interfaces ---------- */
interface GetSustainabilityUVScansOvertimeInput {
  end_date: Date;
  gtins: string[];
  start_date: Date;
  timestamp_offset: GetISOTimestampOffsetOutput;
}

export interface UVScan {
  gtin: string;
  count: number;
}

export type SustainabilityUVScansOvertime = Record<string, UVScan[]>;

/* ---------- Function ---------- */
const get_sustainability_uv_scans_overtime = async ({
  gtins,
  end_date,
  start_date,
  timestamp_offset,
}: GetSustainabilityUVScansOvertimeInput) => {
  /* ----------
   * Preparing filters and arguments for the query
   * ---------- */

  const sustainability_uv_scans_overtime: SustainabilityUVScansOvertime = {};

  const difference_in_days = differenceInDays(end_date, start_date);

  const bucket = get_bucket({ time_range: difference_in_days });

  if (!gtins.length) return { sustainability_uv_scans_overtime, bucket };

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;

  const sql_date_filter = date_range_sql(start_date, end_date);

  const gtins_filter = `AND gtin IN (${gtins
    .map(gtin => `'${gtin}'`)
    .join(', ')})`;

  let query_string = ``;

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

        sustainability_uv_scans_overtime[date_key] = [];
      });

      query_string = `
        SELECT
          date_format(time, '%Y-%m-%dT%H:00:00Z') as date,
          gtin, SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'uv-scans'
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY date_format(time, '%Y-%m-%dT%H:00:00Z'), gtin
        HAVING SUM(measure_value::bigint) > 0
        ORDER BY date ASC
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

        sustainability_uv_scans_overtime[date_key] = [];
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('day', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, gtin,
          SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'uv-scans'
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, gtin
        HAVING SUM(measure_value::bigint) > 0
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

      sustainability_uv_scans_overtime[initial_date_key] = [];

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

          sustainability_uv_scans_overtime[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('week', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, gtin,
          SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'uv-scans'
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, gtin
        HAVING SUM(measure_value::bigint) > 0
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

      sustainability_uv_scans_overtime[initial_date_key] = [];

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

          sustainability_uv_scans_overtime[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('month', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, gtin,
          SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'uv-scans'
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, gtin
        HAVING SUM(measure_value::bigint) > 0
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
          { ScalarValue: gtin },
          { ScalarValue: count },
        ] = row.Data;

        if (!date || !gtin || !count) return;

        const gtin_index = sustainability_uv_scans_overtime[date]?.findIndex(
          date_item => date_item.gtin === gtin,
        );

        if (gtin_index && gtin_index !== -1) {
          sustainability_uv_scans_overtime[date][gtin_index].count +=
            Number(count);
        } else {
          if (!sustainability_uv_scans_overtime[date]?.length) {
            sustainability_uv_scans_overtime[date] = [];
          }

          sustainability_uv_scans_overtime[date]?.push({
            gtin,
            count: Number(count),
          });
        }
      });

      next_token = NextToken;
    } catch (error) {
      const { message: error_message } =
        error as TimestreamQueryServiceException;

      if (error_message.endsWith('does not exist')) {
        return { sustainability_uv_scans_overtime, bucket };
      }

      throw new Error(error_message);
    }
  } while (next_token);

  /* ----------
   * Padding the results with zeroes
   * ---------- */

  const all_gtins_list = Array.from(
    Object.values(sustainability_uv_scans_overtime).reduce(
      (result: Set<string>, current) => {
        current.forEach(({ gtin }) => result.add(gtin));

        return result;
      },
      new Set<string>(),
    ),
  );

  for (const date in sustainability_uv_scans_overtime) {
    if (
      Object.prototype.hasOwnProperty.call(
        sustainability_uv_scans_overtime,
        date,
      )
    ) {
      const scans = sustainability_uv_scans_overtime[date];

      all_gtins_list.forEach(gtin => {
        if (scans.find(({ gtin: scan_gtin }) => scan_gtin === gtin)) return;

        sustainability_uv_scans_overtime[date].push({
          gtin,
          count: 0,
        });
      });
    }
  }

  return { sustainability_uv_scans_overtime, bucket };
};

/* ---------- Export ---------- */
export { get_sustainability_uv_scans_overtime };
