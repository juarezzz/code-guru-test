/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
const base_coordinates_schema = Yup.object({
  latitude: Yup.number()
    .required('latitude is a required field.')
    .min(-90, 'latitude must be at least -90')
    .max(90, 'latitude must be at most 90'),
  longitude: Yup.number()
    .required('longitude is a required field.')
    .min(-180, 'longitude must be at least -180')
    .max(180, 'longitude must be at most 180'),
});

export const create_mrf_schema = base_coordinates_schema.shape({
  mrf_name: Yup.string()
    .required('mrf_name is a required field.')
    .min(2)
    .max(255),
});

export const update_mrf_schema = base_coordinates_schema.shape({
  mrf_id: Yup.string().required('Missing mrf_id in request body').uuid(),
});
