/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
const attribute_shape = Yup.object({
  id: Yup.string().required(),
  name: Yup.string().required(),
  value: Yup.string().required(),
});

const component_shape = Yup.object({
  id: Yup.string().required(),
  name: Yup.string().required(),
  material: Yup.string().required(),
  weight: Yup.number().required(),
  percentage: Yup.number().required(),
});

const product_shape = Yup.object({
  gtin: Yup.string().required(),
  product_group_name: Yup.string(),
  product_description: Yup.string(),
  image_url: Yup.string().optional(),
  created_at: Yup.number().optional(),
  product_name: Yup.string().required(),
  information_url: Yup.string().optional(),
  components: Yup.array().of(component_shape),
  attributes: Yup.array().of(attribute_shape),
});

export const batch_upload_schema = Yup.object({
  to_add: Yup.array().of(product_shape),
  to_delete: Yup.array().of(Yup.string()),
  to_update: Yup.array().of(product_shape),
});
