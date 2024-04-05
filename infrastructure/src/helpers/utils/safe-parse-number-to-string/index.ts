/* ---------- Functions ---------- */
const safe_parse_number_to_string = (value = 0): string => {
  const casted_value = value.toString();

  if (typeof casted_value !== 'string') return '0';

  return casted_value;
};

export { safe_parse_number_to_string };
