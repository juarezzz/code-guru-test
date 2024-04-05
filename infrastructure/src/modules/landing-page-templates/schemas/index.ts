/* ---------- External ---------- */
import * as Yup from 'yup';

/* ---------- Helpers ---------- */
import { check_if_json } from '_helpers/utils/check-if-json';

/* ---------- Schemas ---------- */
export const create_landing_page_template_schema = Yup.object({
  components: Yup.string().required().test({
    test: check_if_json,
  }),
  global_styles: Yup.string().required().test({
    test: check_if_json,
  }),

  landing_page_template_name: Yup.string().min(3).max(255).required(),
});
