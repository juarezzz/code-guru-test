/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

/* ---------- Functions ---------- */
const required_if_present = (
  value: string | undefined,
  schema: Yup.StringSchema,
) => {
  if (value) {
    return schema.required();
  }

  return schema.optional();
};

/* ---------- Schemas ---------- */
export const update_printer_user_schema = Yup.object({
  name: Yup.string().optional().min(1).max(255),
  job_title: Yup.string().optional().min(1).max(255),

  old_password: Yup.string().when('new_password', required_if_present),

  new_password: Yup.string()
    .matches(PASSWORD_REGEX, "new_password doesn't satisfy requirements.")
    .when('old_password', required_if_present),
});
