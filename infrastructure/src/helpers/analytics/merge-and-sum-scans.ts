import { addMinutes, format, isSameHour } from 'date-fns';

/**
 * Merges and sums scan data within a given object of timestamps and scan arrays.
 * Timestamps are rounded to the nearest hour (XX:00) except for the first and last timestamps,
 * which remain unchanged. The function returns a new object with merged and rounded timestamps.
 *
 * @param {LandingPageOpenCountByDate} data - The input object containing timestamps and scan arrays.
 * @returns {LandingPageOpenCountByDate} - A new object with merged and rounded timestamps.
 */
interface Props<T> {
  data: Record<string, T[]>;
  unique_field: keyof T;
  sum_field: keyof T;
}

export const merge_and_sum_scans = <T>({
  data,
  unique_field,
  sum_field,
}: Props<T>): Record<string, T[]> => {
  const rounded_data: Record<string, T[]> = {};

  // Get an array of timestamps from the input data
  const timestamps = Object.keys(data);

  /**
   * Rounds a timestamp to the nearest hour (XX:00) if it's not the first or last timestamp.
   *
   * @param {string} timestamp - The timestamp to round.
   * @returns {string} - The rounded timestamp.
   */
  function round_timestamp(timestamp: string): string {
    const date = new Date(timestamp);

    if (!isSameHour(date, new Date()))
      return format(addMinutes(date, 30), 'yyyy-MM-dd HH:00');

    return format(date, 'yyyy-MM-dd HH:00');
  }

  /**
   * Sets a specific property of an object to a given value.
   *
   * @param {NonNullable<Obj>} object - The object whose property will be set.
   * @param {Property} property - The property key to set.
   * @param {Obj[Property]} value - The value to assign to the property.
   * @returns {void}
   */
  const setter = <
    Obj extends Record<string, number>,
    Property extends keyof Obj,
  >(
    object: NonNullable<Obj>,
    propery: Property,
    value: Obj[Property],
  ): void => {
    object[propery] = value;
  };

  // Iterate through timestamps and perform rounding, merging, and summing of scan data
  timestamps.forEach((timestamp, i) => {
    const rounded_timestamp =
      i === 0 || i === timestamps.length - 1
        ? timestamp
        : round_timestamp(timestamp);

    if (!rounded_data[rounded_timestamp]) rounded_data[rounded_timestamp] = [];

    const scans = data[timestamp];

    scans.forEach(scan => {
      const existing_scan = rounded_data[rounded_timestamp].find(
        s => s[unique_field] === scan[unique_field],
      );

      if (existing_scan) {
        const current_value = existing_scan[sum_field] as number;
        const scan_value = scan[sum_field] as number;

        setter(existing_scan, sum_field as string, current_value + scan_value);

        return;
      }

      rounded_data[rounded_timestamp].push(scan);
    });
  });

  // Sort the merged data and return it as an object
  return Object.fromEntries(Object.entries(rounded_data).sort());
};
