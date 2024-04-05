/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;

/* ---------- Schemas ---------- */
export const forgot_password_params_schema = Yup.object({
  email: Yup.string().email().required(),
  code: Yup.string().required().min(1).max(255),
  password: Yup.string().required().matches(PASSWORD_REGEX),
});
