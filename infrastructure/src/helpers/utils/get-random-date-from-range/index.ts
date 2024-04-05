/* ---------- Interfaces ---------- */
interface GetRandomDateFromRangeInput {
  start_date: Date;
  end_date: Date;
}

/* ---------- Functions ---------- */
export const get_random_date_from_range = ({
  start_date,
  end_date,
}: GetRandomDateFromRangeInput): Date => {
  const from_time = start_date.getTime();
  const to_time = end_date.getTime();

  return new Date(from_time + Math.random() * (to_time - from_time));
};
