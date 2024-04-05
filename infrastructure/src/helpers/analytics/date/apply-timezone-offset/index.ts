/* ---------- External ---------- */
import { subMinutes } from 'date-fns';

interface ApplyTimezoneOffsetInput {
  date: Date;
  offset_in_minutes: number;
}

export const apply_timezone_offset = ({
  date,
  offset_in_minutes,
}: ApplyTimezoneOffsetInput): Date => {
  const total_min_offset =
    date.getTimezoneOffset() + // The local timezone offset in minutes
    offset_in_minutes; // The offset in minutes from the user's timezone

  return subMinutes(date, total_min_offset);
};
