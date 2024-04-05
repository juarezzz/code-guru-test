export const get_bucket = ({ time_range }: { time_range: number }) => {
  if (time_range <= 3) {
    return 'hourly';
  }

  if (time_range > 3 && time_range <= 30) {
    return 'daily';
  }

  if (time_range > 30 && time_range <= 90) {
    return 'weekly';
  }

  return 'monthly';
};
