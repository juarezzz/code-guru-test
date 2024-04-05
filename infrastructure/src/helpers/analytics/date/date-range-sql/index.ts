export const date_range_sql = (
  start_date: Date,
  end_date: Date,
  time_column = 'time',
) => {
  return `${time_column} BETWEEN from_milliseconds(${start_date.getTime()}) AND from_milliseconds(${end_date.getTime()})`;
};
