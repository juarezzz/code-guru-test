/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
export const create_mrf_user_invite_schema = Yup.object({
  email: Yup.string().email().required(),
  mrf_id: Yup.string().uuid().required(),
  role: Yup.string().required(),
});

export const create_multiple_mrf_user_invites_schema = Yup.object({
  users: Yup.array(
    Yup.object({
      email: Yup.string().email().required(),
      role: Yup.string().required(),
    }),
  )
    .min(1)
    .max(25)
    .required(),
});
