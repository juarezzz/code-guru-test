/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
export const body_schema = Yup.object({
  branch: Yup.string().required('Missing source branch'),
  pipelines: Yup.array()
    .of(
      Yup.string().oneOf(
        [
          'backend',
          'diagnostics',
          'frontend',
          'admin_web',
          'rc_web',
          'printer_web',
        ],
        'Invalid pipeline choice',
      ),
    )
    .min(1, 'You have to specify at least one pipeline')
    .required('You have to specify at least one pipeline'),
});
