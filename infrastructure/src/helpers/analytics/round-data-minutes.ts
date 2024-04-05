import { parse, addMinutes, format } from 'date-fns';

/**
 * Corrects the minutes in a given object of date-time entries.
 * Minutes are rounded to '00' for all entries except the first and last ones.
 *
 * @param data - An object containing date-time entries as keys and associated values.
 * @returns A new object with corrected date-time entries.
 */
export const round_minutes = <T>(
  data: Record<string, T>,
): Record<string, T> => {
  const keys = Object.keys(data);
  const result: Record<string, T> = {};

  keys.forEach((date_str, i) => {
    const date = parse(date_str, 'yyyy-MM-dd HH:mm', new Date());
    const minutes = date.getMinutes();

    // First and last entry, keep as-is
    if (i === 0 || i === keys.length - 1) {
      result[date_str] = data[date_str];

      return;
    }

    // Round the minutes to the nearest hour
    const rounded_date = addMinutes(date, -(minutes % 60));

    result[format(rounded_date, 'yyyy-MM-dd HH:mm')] = data[date_str];
  });

  return result;
};
