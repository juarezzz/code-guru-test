/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Schemas ---------- */
export const create_product_schema = Yup.object({
  product_name: Yup.string()
    .required('Product name is a required field.')
    .min(2)
    .max(255),
  product_description: Yup.string().default('').max(255),
  gtin: Yup.string().required('GTIN is a required field.').min(2).max(55),
  product_group_name: Yup.string().max(255),
  attributes: Yup.array().of(
    Yup.object({
      name: Yup.string().required().min(2).max(255),
      value: Yup.string().required().max(255),
    }),
  ),
  components: Yup.array().of(
    Yup.object({
      name: Yup.string().required().min(2).max(255),
      material: Yup.string().required().min(2).max(255),
      percentage: Yup.string().required().min(1).max(3),
      weight: Yup.string().min(1).max(4),
    }),
  ),
});

export const create_product_to_product_group_association = Yup.object({
  product_group_sort_key: Yup.string().required().min(2).max(255),
  product_sort_key: Yup.string().required().min(2).max(255),
});
