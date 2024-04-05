/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const GCP_REGEX = /^(\d{4,12})$/;

/* ---------- Shapes ---------- */
export const add_gcps_schema = Yup.object({
  gcps: Yup.array()
    .required('A list of GCPs is required')
    .min(1, 'At least one GCP is required')
    .of(
      Yup.string()
        .required("GCP can't be empty")
        .matches(GCP_REGEX, 'Invalid GCP supplied'),
    ),
});
