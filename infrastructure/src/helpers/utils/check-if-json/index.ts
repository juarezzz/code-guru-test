/* ---------- Functions ---------- */
const check_if_json = (value?: string) => {
  if (!value) return false;

  try {
    JSON.parse(value);

    return true;
  } catch {
    return false;
  }
};

export { check_if_json };
