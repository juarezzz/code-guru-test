/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const ADMIN_GROUPS = ['polytag-super-admin', 'polytag-admin'];

/* ---------- Schemas ---------- */
export const admin_user_invite_schema = Yup.object({
  email: Yup.string().email().required(),
  cognito_group: Yup.string().oneOf(ADMIN_GROUPS).required(),
});

export const create_admin_users_invite_schema = Yup.object({
  users: Yup.array(admin_user_invite_schema).min(0).max(25).required(),
});
