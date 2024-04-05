/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Constants ---------- */
const ORG_SIZES = [
  'Tier 1 (<£5m)',
  'Tier 2 (£5m - £50m)',
  'Tier 3 (£50m - £150m)',
  'Tier 4 (£150m+)',
];

/* ---------- Shapes ---------- */
export const create_brand_schema = Yup.object({
  industry: Yup.string()
    .required("'industry' is a required field")
    .min(2, "'industry' must be at least two characters long")
    .max(255, "'industry' must be at most 255 characters long"),

  brand_name: Yup.string()
    .required("'brand_name' is a required field")
    .min(2, "'brand_name' must be at least two characters long")
    .max(255, "'brand_name' must be at most 255 characters long"),

  gs1_territory: Yup.string()
    .required("'gs1_territory' is a required field")
    .min(2, "'gs1_territory' must be at least two characters long")
    .max(255, "'gs1_territory' must be at most 255 characters long"),

  organisation_size: Yup.string()
    .required("'organization_size' is a required field")
    .oneOf(
      ORG_SIZES,
      `'organization_size' must be one of the following: ${ORG_SIZES.join(
        ', ',
      )}`,
    ),
});
