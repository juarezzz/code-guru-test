/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
export const create_printer_user_invite_schema = Yup.object({
  email: Yup.string().email().required(),
  printer_id: Yup.string().uuid().required(),
});
