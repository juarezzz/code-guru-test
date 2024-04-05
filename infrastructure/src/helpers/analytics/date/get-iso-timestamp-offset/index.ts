/* ---------- Interfaces ---------- */
export interface GetISOTimestampOffsetInput {
  string_date: string;
}

export interface GetISOTimestampOffsetOutput {
  literal_offset: string;
  offset_in_minutes: number;
}

export const get_iso_timestamp_offset = ({
  string_date,
}: GetISOTimestampOffsetInput): GetISOTimestampOffsetOutput => {
  const offset_regex = /([-+]\d{2}):?(\d{2})$/;
  const matching_date = string_date.match(offset_regex);

  if (!matching_date) return { literal_offset: 'Z', offset_in_minutes: 0 };

  const sign = matching_date[1][0] === '+' ? 1 : -1;
  const hours = parseInt(matching_date[1].slice(1), 10);
  const minutes = parseInt(matching_date[2], 10);

  const offset_in_minutes = sign * (hours * 60 + minutes);

  return { literal_offset: matching_date?.[0] || 'Z', offset_in_minutes };
};
