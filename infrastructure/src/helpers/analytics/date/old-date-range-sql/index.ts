export const date_range_sql = (
  start_date: string,
  end_date: string,
  time_column = 'time',
) => {
  return `${time_column} BETWEEN from_milliseconds(${start_date}) AND from_milliseconds(${end_date})`;
};
