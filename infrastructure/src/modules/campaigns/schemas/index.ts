/* ---------- External ---------- */
import * as Yup from 'yup';
/* ---------- Constants ---------- */
import { error_messages } from '_constants/error-messages';
/* ---------- Helpers ---------- */
import { handle_http_error } from '_helpers/handlers/handle-http-error';

/* ---------- Shapes ---------- */
const campaign_landing_page_schema = Yup.object({
  end_date: Yup.string()
    .required('Missing landing page end date.')
    .matches(/\d{4}-\d{2}-\d{2}$/),

  start_date: Yup.string()
    .required('Missing landing page start date.')
    .matches(/\d{4}-\d{2}-\d{2}$/),

  landing_page_name: Yup.string()
    .required('Missing landing page name.')
    .min(1)
    .max(255),

  landing_page_sort_key: Yup.string()
    .required('Missing landing page sort key.')
    .min(1),
});

/* ---------- Validator functions ---------- */
const validate_landing_pages: Yup.TestFunction<
  Yup.TypeOf<Yup.ArraySchema<typeof campaign_landing_page_schema>>
> = value => {
  if (!value?.length) return true;

  const sorted_landing_pages = value.sort((a, b) => {
    const previous_lp_date = new Date(a?.start_date || 0).getTime();
    const current_lp_date = new Date(b?.start_date || 0).getTime();

    return previous_lp_date - current_lp_date;
  });

  for (const [lp_index, current_lp] of sorted_landing_pages.entries()) {
    const previous_lp = sorted_landing_pages[lp_index - 1];

    const lp_start_date = new Date(
      current_lp?.start_date || Number.MAX_SAFE_INTEGER,
    ).getTime();

    const lp_end_date = new Date(
      current_lp?.end_date || Number.MIN_SAFE_INTEGER,
    ).getTime();

    if (lp_start_date >= lp_end_date) {
      throw new Error(
        handle_http_error({
          code: error_messages['landing-page-start-equals-end'].code,
          message: error_messages['landing-page-start-equals-end'].message,
          status_code: 400,
        }),
      );
    }

    if (!previous_lp) continue;

    const prev_lp_end_date = new Date(previous_lp.end_date || 0).getTime();

    if (lp_start_date <= prev_lp_end_date) {
      throw new Error(
        handle_http_error({
          code: error_messages['landing-page-date-overlap'].code,
          message: error_messages['landing-page-date-overlap'].message,
          status_code: 400,
        }),
      );
    }
  }

  return true;
};

export const create_campaign_schema = Yup.object({
  campaign_name: Yup.string()
    .required('Campaign name is a required field.')
    .min(1)
    .max(255),

  campaign_product_groups: Yup.array()
    .default([])
    .of(
      Yup.object({
        product_group_count: Yup.number().optional().default(0).min(0),

        product_group_name: Yup.string()
          .required('Missing product group name.')
          .min(1)
          .max(255),

        product_group_sort_key: Yup.string()
          .required('Missing product group sort key.')
          .min(1),
      }),
    ),

  campaign_landing_pages: Yup.array()
    .default([])
    .of(campaign_landing_page_schema)
    .test(
      'Landing page dates validation',
      'Failed landing page dates validation',
      validate_landing_pages,
    ),
});

export const update_campaign_schema = Yup.object({
  campaign_name: Yup.string().optional().min(1).max(255),

  campaign_product_groups: Yup.array()
    .default([])
    .of(
      Yup.object({
        product_group_count: Yup.number().optional().default(0).min(0),

        product_group_name: Yup.string()
          .required('Missing product group name.')
          .min(1)
          .max(255),

        product_group_sort_key: Yup.string()
          .required('Missing product group sort key.')
          .min(1),
      }),
    ),

  campaign_landing_pages: Yup.array()
    .default([])
    .of(campaign_landing_page_schema)
    .test(
      'Landing page dates validation',
      'Failed landing page dates validation',
      validate_landing_pages,
    ),
});
