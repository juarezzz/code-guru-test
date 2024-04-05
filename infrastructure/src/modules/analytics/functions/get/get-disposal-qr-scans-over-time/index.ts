/* ---------- External ---------- */
import { chunk } from 'lodash';
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

/* ---------- Types ---------- */
import { GetISOTimestampOffsetOutput } from '_helpers/analytics/date/get-iso-timestamp-offset';

/* ---------- Clients ---------- */
import { timestream_client_query } from '_clients/timestream';

/* ---------- Helpers ---------- */
import { get_bucket } from '_helpers/analytics/get-bucket';
import { date_range_sql } from '_helpers/analytics/date/date-range-sql';
import { apply_timezone_offset } from '_helpers/analytics/date/apply-timezone-offset';

/* ---------- Modules ---------- */
import { get_third_party_by_id } from '_modules/third-party/functions/get/get-third-party-by-id';

/* ---------- Models ---------- */
import { ThirdParty } from '_modules/third-party/models';

/* ---------- Interfaces ---------- */

export interface Scan {
  type: string;
  count: number;
  third_party_id: string;
  third_party_name?: string;
}

export type DisposalQRScansOvertime = Record<string, Scan[]>;

interface GetDisposalQRScansInput {
  end_date: Date;
  gtins: string[];
  start_date: Date;
  timestamp_offset: GetISOTimestampOffsetOutput;
}

/* ---------- Function ---------- */
const get_disposal_qr_scans_overtime = async ({
  gtins,
  end_date,
  start_date,
  timestamp_offset,
}: GetDisposalQRScansInput) => {
  /* ----------
   * Preparing filters and arguments for the query
   * ---------- */

  const disposal_qr_scans_overtime: DisposalQRScansOvertime = {};

  const difference_in_days = differenceInDays(end_date, start_date);

  const bucket = get_bucket({ time_range: difference_in_days });

  if (!gtins.length) return { disposal_qr_scans_overtime, bucket };

  const table = `"${process.env.TIMESTREAM_NAME}"."${process.env.TIMESTREAM_NAME}"`;

  const sql_date_filter = date_range_sql(start_date, end_date);

  const gtins_filter = `AND CAST(gtin AS bigint) IN (${gtins
    .map(gtin => `${gtin}`)
    .join(', ')})`;

  let query_string = ``;

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

        disposal_qr_scans_overtime[date_key] = [];
      });

      query_string = `
        SELECT
          date_format(time, '%Y-%m-%dT%H:00:00Z') as date,
          data_type, third_party_id, SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'third_party_measure'
        AND (
          data_type = 'third_party_redeem' OR
          data_type = 'third_party_pre_redeem'
        )
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY
          date_format(time, '%Y-%m-%dT%H:00:00Z'),
          data_type, third_party_id
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

        disposal_qr_scans_overtime[date_key] = [];
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('day', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, data_type,
          third_party_id, sum(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'third_party_measure'
        AND (
          data_type = 'third_party_redeem' OR
          data_type = 'third_party_pre_redeem'
        )
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, data_type, third_party_id
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

      disposal_qr_scans_overtime[initial_date_key] = [];

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

          disposal_qr_scans_overtime[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('week', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, data_type,
          third_party_id, SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'third_party_measure'
        AND (
          data_type = 'third_party_redeem' OR
          data_type = 'third_party_pre_redeem'
        )
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, data_type, third_party_id
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

      disposal_qr_scans_overtime[initial_date_key] = [];

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

          disposal_qr_scans_overtime[date_key] = [];
        }
      });

      const ts_date_format = '%Y-%m-%dT%H:00:00Z';

      const date_offset_exp = `date_add('minute', ${timestamp_offset.offset_in_minutes}, time)`;

      const date_format_exp = `date_format(date_add('minute', ${
        timestamp_offset.offset_in_minutes * -1
      }, date_trunc('month', ${date_offset_exp})), '${ts_date_format}')`;

      query_string = `
        SELECT
          ${date_format_exp} as date, data_type,
          third_party_id, SUM(measure_value::bigint) as count
        FROM ${table}
        WHERE measure_name = 'third_party_measure'
        AND (
          data_type = 'third_party_redeem' OR
          data_type = 'third_party_pre_redeem'
        )
        ${gtins_filter}
        AND ${sql_date_filter}
        GROUP BY ${date_format_exp}, data_type, third_party_id
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
          { ScalarValue: type },
          { ScalarValue: third_party_id },
          { ScalarValue: count },
        ] = row.Data;

        if (!date || !type || !third_party_id || !count) return;

        const third_party_type_index = disposal_qr_scans_overtime[
          date
        ]?.findIndex(
          date_item =>
            date_item.type === type &&
            date_item.third_party_id === third_party_id,
        );

        if (third_party_type_index && third_party_type_index !== -1) {
          disposal_qr_scans_overtime[date][third_party_type_index].count +=
            Number(count);
        } else {
          if (!disposal_qr_scans_overtime[date]?.length) {
            disposal_qr_scans_overtime[date] = [];
          }

          disposal_qr_scans_overtime[date]?.push({
            type,
            third_party_id,
            count: Number(count),
          });
        }
      });

      next_token = NextToken;
    } catch (error) {
      const { message: error_message } =
        error as TimestreamQueryServiceException;

      if (error_message.endsWith('does not exist')) {
        return { disposal_qr_scans_overtime, bucket };
      }

      throw new Error(error_message);
    }
  } while (next_token);

  /* ----------
   * Fetching information about third parties
   * ---------- */

  const third_parties_map: Map<string, ThirdParty> = new Map();

  const unique_entries_list = Array.from(
    Object.values(disposal_qr_scans_overtime).reduce(
      (result: Set<string>, current) => {
        current.forEach(({ third_party_id, type }) =>
          result.add(JSON.stringify({ third_party_id, type })),
        );

        return result;
      },
      new Set<string>(),
    ),
  );

  const parsed_unique_entries_list: Array<{
    third_party_id: string;
    type: string;
  }> = unique_entries_list.map(entry => JSON.parse(entry));

  const unique_third_parties_list = Array.from(
    new Set(
      parsed_unique_entries_list.map(({ third_party_id }) => third_party_id),
    ),
  );

  const fetch_third_parties_commands = unique_third_parties_list.map(
    third_party_id => get_third_party_by_id({ third_party_id }),
  );

  const fetch_third_parties_commands_batches = chunk(
    fetch_third_parties_commands,
    25,
  );

  for (const fetch_third_parties_commands_batch of fetch_third_parties_commands_batches) {
    const new_third_parties = await Promise.all(
      fetch_third_parties_commands_batch,
    );

    new_third_parties.forEach(({ third_party }) => {
      if (!third_party) return;

      const third_party_id = third_party.partition_key.split('#')[1];

      third_parties_map.set(third_party_id, third_party);
    });
  }

  /* ----------
   * Padding the results with zeroes and adding names
   * ---------- */

  for (const date in disposal_qr_scans_overtime) {
    if (
      Object.prototype.hasOwnProperty.call(disposal_qr_scans_overtime, date)
    ) {
      const scans = disposal_qr_scans_overtime[date];

      parsed_unique_entries_list.forEach(({ third_party_id, type }) => {
        const scan_index = scans.findIndex(
          scan => scan.third_party_id === third_party_id && scan.type === type,
        );

        const third_party_name =
          third_parties_map.get(third_party_id)?.third_party_name;

        if (scan_index !== -1) {
          disposal_qr_scans_overtime[date][scan_index].third_party_name =
            third_party_name;

          return;
        }

        disposal_qr_scans_overtime[date].push({
          type,
          count: 0,
          third_party_id,
          third_party_name,
        });
      });
    }
  }

  return { disposal_qr_scans_overtime, bucket };
};

/* ---------- Export ---------- */
export { get_disposal_qr_scans_overtime };
