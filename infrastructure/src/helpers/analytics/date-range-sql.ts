import { isToday } from 'date-fns';

export const date_range_sql = (
  start_date: string,
  end_date: string,
  time_column = 'time',
) => {
  if (start_date === end_date && isToday(new Date(start_date))) {
    const start = new Date(end_date).getTime() - 24 * 60 * 60 * 1000;
    const end = new Date(end_date).getTime();

    return `${time_column} BETWEEN from_milliseconds(${start}) AND from_milliseconds(${end})`;
  }

  const start = new Date(`${start_date}T00:00:00.000Z`).getTime();
  const end = new Date(`${end_date}T23:59:59.999Z`).getTime();

  return `${time_column} BETWEEN from_milliseconds(${start}) AND from_milliseconds(${end})`;
};
