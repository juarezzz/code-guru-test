export const get_date = (dates: string[]) => {
  const index = Math.floor(Math.random() * dates.length);
  const date = dates[index];

  return date;
};
