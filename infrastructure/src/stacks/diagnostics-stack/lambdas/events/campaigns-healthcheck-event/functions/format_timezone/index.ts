import { addMinutes, subMinutes } from 'date-fns';

export function format_timezone(date: Date): Date {
  const offset = date.getTimezoneOffset();

  return offset > 0
    ? addMinutes(date, offset)
    : subMinutes(date, Math.abs(offset));
}
