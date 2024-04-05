/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const THIRD_PARTY_GROUPS = ['third-party-admin', 'third-party-labels'];

/* ---------- Schemas ---------- */
export const create_third_party_users_invite_schema = Yup.object({
  email: Yup.string().email().required(),
  third_party_id: Yup.string().uuid().required(),
  third_party_groups: Yup.array(
    Yup.string().oneOf(THIRD_PARTY_GROUPS).required(),
  )
    .min(1)
    .required(),
});
