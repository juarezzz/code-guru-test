export const get_array_of_dates = (start_date: string, end_date: string) => {
  if (start_date === end_date) return [start_date];

  const dates = [];

  const move = new Date(start_date);

  let str_date = start_date;

  while (str_date < end_date) {
    str_date = move.toISOString().slice(0, 10);
    dates.push(str_date);
    move.setDate(move.getDate() + 1);
  }

  return dates;
};
