import { add, differenceInDays, format } from 'date-fns';

const prepare_date_range = ({
  time,
  from,
  to,
}: {
  time?: string;
  from?: string | number;
  to?: string | number;
}) => {
  if (!from || !to) return '';

  const from_valid = new Date(+from).getTime() > 0;
  const to_valid = new Date(+to).getTime() > 0;
  const time_column = time ?? 'time';

  if (from_valid && to_valid) {
    return `and ${time_column} BETWEEN from_milliseconds(${from}) AND from_milliseconds(${to})`;
  }

  if (from_valid && !to_valid) {
    return `and ${time_column} BETWEEN from_milliseconds(${from}) AND from_milliseconds(${new Date().getTime()})`;
  }

  return '';
};

const difference_in_days = (
  first_date: string,
  second_date: string,
): number => {
  const first_date_parsed = new Date(first_date);
  const second_date_parsed = new Date(second_date);

  return differenceInDays(first_date_parsed, second_date_parsed);
};

const correct_offset = (date_str: string, reference: string) => {
  const tz_offset = /[-|+][0-9][0-9]:[0-9][0-9]$/.test(reference)
    ? new Date(reference).getTimezoneOffset() *
      Number(reference.includes('+') ? 1 : -1)
    : 0;

  return format(
    add(new Date(date_str), { minutes: tz_offset }),
    'yyyy-MM-dd HH:mm',
  );
};

export { prepare_date_range, difference_in_days, correct_offset };
